import opentype from 'opentype.js';
import { measureTextFallback, getTextMeasurementStrategy, hasComplexEmojis } from './text-measurement.js';

let loadedFonts = {
  primary: null,
  fallbacks: {}
};

async function initializeFont(fontSource) {
  // If font already loaded and no new source provided, return existing
  if (loadedFonts.primary && !fontSource) {
    return loadedFonts.primary;
  }

  // If no font source provided, return null (use fallback measurement)
  if (!fontSource) {
    return null;
  }

  try {
    let buffer;

    // Detect input type and convert to ArrayBuffer
    if (typeof fontSource === 'string') {
      if (fontSource.startsWith('http://') || fontSource.startsWith('https://')) {
        // URL - fetch the font
        console.log(`Fetching font from URL: ${fontSource}`);
        const response = await fetch(fontSource);
        if (!response.ok) {
          throw new Error(`Failed to fetch font: ${response.status}`);
        }
        buffer = await response.arrayBuffer();
      } else if (fontSource.startsWith('data:')) {
        // Data URL - extract base64 part
        console.log('Loading font from data URL');
        const base64Data = fontSource.split(',')[1];
        buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
      } else {
        // Assume raw base64 string
        console.log('Loading font from base64 string');
        buffer = Uint8Array.from(atob(fontSource), c => c.charCodeAt(0)).buffer;
      }
    } else if (fontSource instanceof ArrayBuffer) {
      // Already an ArrayBuffer
      console.log('Loading font from ArrayBuffer');
      buffer = fontSource;
    } else if (fontSource instanceof Uint8Array) {
      // Uint8Array
      console.log('Loading font from Uint8Array');
      buffer = fontSource.buffer;
    } else {
      throw new Error('Unsupported font source type. Expected URL string, base64 string, ArrayBuffer, or Uint8Array');
    }

    loadedFonts.primary = opentype.parse(buffer);
    console.log(`✅ Font loaded: ${loadedFonts.primary.names.fontFamily?.en || 'Unknown'}`);

    return loadedFonts.primary;
  } catch (error) {
    console.warn('Failed to load font, falling back to mathematical approximation:', error.message);
    loadedFonts.primary = null;
    return null;
  }
}

// Detect if text needs a specific font for accurate measurement
function needsSpecialFont(text) {
  // Check if text contains CJK characters that might not be well-covered by Satoshi
  return [...text].some(char => {
    const code = char.codePointAt(0);
    return (
      (code >= 0x3040 && code <= 0x309F) ||   // Hiragana
      (code >= 0x30A0 && code <= 0x30FF) ||   // Katakana
      (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK Unified Ideographs
      (code >= 0xAC00 && code <= 0xD7AF)      // Hangul Syllables
    );
  });
}


// Accurate text measurement using OpenType.js (supports emojis, international text)
async function measureTextAccurate(text, fontSize = 48, fontFamily = 'Arial') {
  const font = await initializeFont();
  const requiresSpecialFont = needsSpecialFont(text);
  const hasEmojis = hasComplexEmojis(text);

  // for text with emojis, skip OpenType.js entirely. it's very inaccurate with compound emojis
  if (hasEmojis) {
    console.log('Skipping OpenType.js for emoji-containing text, using fallback');
    return measureTextFallback(text, fontSize, fontFamily || 'Satoshi');
  }

  if (font) {
    try {
      // Check if text contains many digits which might cause spacing issues
      const digitCount = (text.match(/\d/g) || []).length;
      const hasMultipleDigits = digitCount > 2;

      // Use getPath for more accurate bounds measurement
      const path = font.getPath(text, 0, 0, fontSize);
      const bbox = path.getBoundingBox();

      // Get advance width for comparison
      const advanceWidth = font.getAdvanceWidth(text, fontSize);

      // Calculate actual text bounds
      const actualWidth = bbox.x2 - bbox.x1;
      const actualHeight = bbox.y2 - bbox.y1;

      // Get font metrics for baseline calculations
      const fontScale = 1 / font.unitsPerEm * fontSize;
      const ascent = font.ascender * fontScale;
      const descent = Math.abs(font.descender * fontScale);

      // Apply digit-specific adjustments for better spacing
      let adjustedWidth = actualWidth;
      if (hasMultipleDigits) {
        // Digits in proportional fonts can have inconsistent spacing
        // Add extra padding when multiple digits are present
        const digitPadding = digitCount * fontSize * 0.05; // 5% per digit
        adjustedWidth = Math.max(actualWidth + digitPadding, advanceWidth);
      } else {
        // Use the larger of advance width or bounding box width for safety
        adjustedWidth = Math.max(actualWidth, advanceWidth * 0.95);
      }

      // If text requires special font but we're using a fallback, add significant safety margin
      if (requiresSpecialFont) {
        adjustedWidth *= 1.5; // 50% safety margin for CJK characters - they're often wider than measured
      }

      return {
        width: adjustedWidth,
        height: Math.max(actualHeight, ascent + descent),
        actualBoundingBoxAscent: ascent,
        actualBoundingBoxDescent: descent,
        fontName: font.names.fontFamily?.en || 'Unknown',
        isAccurate: !requiresSpecialFont, // Less accurate if we need special font but don't have it
        // Debug info
        advanceWidth: advanceWidth,
        boundingWidth: actualWidth,
        boundingBox: bbox,
        digitAdjustment: hasMultipleDigits ? digitCount * fontSize * 0.07 : 0,
        needsSpecialFont: requiresSpecialFont
      };
    } catch (error) {
      console.warn('OpenType measurement failed, using fallback:', error.message);
    }
  }

  // Fallback to mathematical approximation - this is especially good for CJK
  return measureTextFallback(text, fontSize, fontFamily || 'Satoshi');
}


// Calculate optimal font size to fit text within constraints
async function calculateFontSize(text, maxWidth, maxHeight = null, minFontSize = 12, maxFontSize = 100) {
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    const metrics = await measureTextAccurate(text, fontSize);

    // Use text analysis for safety margins
    const strategy = getTextMeasurementStrategy(text);
    const safetyMargin = 1 - strategy.recommendedSafetyMargin;
    const safeWidth = maxWidth * safetyMargin;

    console.log(`Font size ${fontSize}: measured=${metrics.width.toFixed(1)}, safeWidth=${safeWidth.toFixed(1)}, maxWidth=${maxWidth.toFixed(1)}, hasIntl=${strategy.hasComplexScripts}`);

    if (metrics.width <= safeWidth && (!maxHeight || metrics.height <= maxHeight)) {
      return { fontSize, metrics };
    }

    fontSize -= 1;
  }

  return { fontSize: minFontSize, metrics: await measureTextAccurate(text, minFontSize) };
}


async function createDynamicSVGImage(options = {}) {
  const {
    width = 270,
    height = 270,
    text = 'Hello World',
    textColor = [255, 255, 255, 1],
    backgroundImageUrl = null,
    textX = null,
    textY = null,
    maxTextWidth = null,
    autoFontSize = true,
    ensStyle = true, // Enable ens-style layout by default
    maxFontSize = 68, // Maximum font size limit
    fontFamily = 'sans-serif', // Font family name (used for both embedded and fallback)
    fontBase64 = null // Optional: base64 font data to embed in SVG with fontFamily name
  } = options;

  // Calculate text area (leave substantial padding for international characters and emojis)
  const hasInternationalChars = [...text].some(char => {
    const code = char.codePointAt(0);
    return (
      (code >= 0x3040 && code <= 0x309F) ||  // Hiragana
      (code >= 0x30A0 && code <= 0x30FF) ||  // Katakana
      (code >= 0x4E00 && code <= 0x9FAF) ||  // CJK Ideographs
      (code >= 0x3400 && code <= 0x4DBF) ||  // CJK Extension A
      (code >= 0x0590 && code <= 0x05FF) ||  // Hebrew
      (code >= 0x0900 && code <= 0x097F) ||  // Devanagari (Hindi)
      (code >= 0x10A0 && code <= 0x10FF) ||  // Georgian
      (code >= 0x0370 && code <= 0x03FF) ||  // Greek
      (code >= 0x0400 && code <= 0x04FF) ||  // Cyrillic (Russian)
      (code >= 0x1F000 && code <= 0x1FFFF) || // All emoji blocks
      (code >= 0x2600 && code <= 0x26FF) ||   // Miscellaneous Symbols
      (code >= 0x2700 && code <= 0x27BF)      // Dingbats
    );
  });
  // Calculate text area with special handling for CJK text
  let textAreaWidth, paddingX, paddingY;

  if (ensStyle && hasInternationalChars) {
    // Conservative calculation only for CJK text
    const logoXPosition = 70;
    const rightPadding = 20;
    const availableWidth = width - logoXPosition - rightPadding; // 180px for 270px canvas
    textAreaWidth = maxTextWidth || (availableWidth * 0.85); // Use only 85% for CJK
    paddingX = logoXPosition;
    paddingY = 20;
  } else {
    // Original logic for Latin text
    const paddingMultiplier = hasInternationalChars ? 0.6 : 0.8;
    textAreaWidth = maxTextWidth || (width * paddingMultiplier);
    paddingX = (width - textAreaWidth) / 2;
    paddingY = (height - textAreaWidth) / 2;
  }

  const textAreaHeight = height * 0.6;

  // Calculate optimal font size if auto-sizing is enabled
  let fontSize = options.fontSize || 48;
  let metrics = null;
  if (autoFontSize && text && text.trim()) {
    const result = await calculateFontSize(text, textAreaWidth, textAreaHeight, 12, maxFontSize);
    fontSize = result.fontSize;
    metrics = result.metrics;
    console.log(`Auto-calculated font size: ${fontSize}px for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (${metrics.isAccurate ? 'OpenType' : 'fallback'} measurement)`);
  } else {
    // Ensure fontSize doesn't exceed maxFontSize even when manually specified
    fontSize = Math.min(fontSize, maxFontSize);
    metrics = await measureTextAccurate(text, fontSize);
  }

  // Text at bottom center
  let finalTextX, finalTextY;
  let textAnchor = 'middle';
  let dominantBaseline = 'alphabetic';

  if (textX !== null && textY !== null) {
    // Use explicit positioning if provided
    finalTextX = textX;
    finalTextY = textY;
  } else if (ensStyle) {
    // left align with logo, bottom with padding
    finalTextX = 70; // Start from same x position as logo
    finalTextY = height - 72; // Bottom positioning with padding
    textAnchor = 'start'; // Left align text
  } else {
    // Default: center both ways
    finalTextX = width / 2;
    finalTextY = height / 2;
    dominantBaseline = 'central';
  }

  const textColorRGB = `rgb(${textColor[0]}, ${textColor[1]}, ${textColor[2]})`;

  // Create background element with background
  let backgroundElement = '';
  if (backgroundImageUrl) {
    try {
      // Fetch the image and convert to base64 for SVG embedding
      const imageResponse = await fetch(backgroundImageUrl);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        backgroundElement = `<image href="data:${contentType};base64,${imageBase64}" width="${width}" height="${height}"/>
        <rect width="${width}" height="${height}" fill="#000" fill-opacity=".12"/>`;
      } else {
        console.warn(`Failed to fetch background image: ${imageResponse.status}`);
        backgroundElement = `<rect width="${width}" height="${height}" fill="url(#paint0_linear)"/>`;
      }
    } catch (error) {
      console.warn('Error fetching background image:', error);
      backgroundElement = `<rect width="${width}" height="${height}" fill="url(#paint0_linear)"/>`;
    }
  } else {
    // ENS-style gradient as default
    backgroundElement = `<rect width="${width}" height="${height}" fill="url(#paint0_linear)"/>`;
  }

  if (ensStyle) {
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${backgroundElement}
    <defs>
      <filter id="dropShadow" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="${height}" width="${width}">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.225" width="200%" height="200%"/>
      </filter>
    </defs>
    <g transform="scale(1.9)">
      <path d="M38.0397 51.0875C38.5012 52.0841 39.6435 54.0541 39.6435 54.0541L52.8484 32L39.9608 41.0921C39.1928 41.6096 38.5628 42.3102 38.1263 43.1319C37.5393 44.3716 37.2274 45.7259 37.2125 47.1C37.1975 48.4742 37.4799 49.8351 38.0397 51.0875Z" fill="white" filter="url(#dropShadow)"/>
      <path d="M32.152 59.1672C32.3024 61.2771 32.9122 63.3312 33.9405 65.1919C34.9689 67.0527 36.3921 68.6772 38.1147 69.9567L52.8487 80C52.8487 80 43.6303 67.013 35.8549 54.0902C35.0677 52.7249 34.5385 51.2322 34.2926 49.6835C34.1838 48.9822 34.1838 48.2689 34.2926 47.5676C34.0899 47.9348 33.6964 48.6867 33.6964 48.6867C32.908 50.2586 32.371 51.9394 32.1043 53.6705C31.9508 55.5004 31.9668 57.3401 32.152 59.1672Z" fill="white" filter="url(#dropShadow)"/>
      <path d="M70.1927 60.9125C69.6928 59.9159 68.4555 57.946 68.4555 57.946L54.1514 80L68.1118 70.9138C68.9436 70.3962 69.6261 69.6956 70.099 68.8739C70.7358 67.6334 71.0741 66.2781 71.0903 64.9029C71.1065 63.5277 70.8001 62.1657 70.1927 60.9125Z" fill="white" filter="url(#dropShadow)"/>
      <path d="M74.8512 52.8328C74.7008 50.7229 74.0909 48.6688 73.0624 46.8081C72.0339 44.9473 70.6105 43.3228 68.8876 42.0433L54.1514 32C54.1514 32 63.3652 44.987 71.1478 57.9098C71.933 59.2755 72.4603 60.7682 72.7043 62.3165C72.8132 63.0178 72.8132 63.7311 72.7043 64.4324C72.9071 64.0652 73.3007 63.3133 73.3007 63.3133C74.0892 61.7414 74.6262 60.0606 74.893 58.3295C75.0485 56.4998 75.0345 54.66 74.8512 52.8328Z" fill="white" filter="url(#dropShadow)"/>
    </g>
    <text
      x="${finalTextX}"
      y="${finalTextY}"
      font-size="${fontSize}px"
      fill="white"
      text-anchor="${textAnchor}"
      filter="url(#dropShadow)">${text}</text>
    <defs>
      ${fontBase64 ? `<style type="text/css">
        @font-face {
          font-family: "${fontFamily}";
          font-style: normal;
          font-weight: 600 900;
          src: url(data:font/truetype;base64,${fontBase64});
        }
      </style>` : ''}
      <style>
        text {
          font-family: '${fontFamily}', 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
          font-style: normal;
          font-variant-numeric: tabular-nums;
          font-weight: bold;
          font-variant-ligatures: none;
          font-feature-settings: "ss01" on, "ss03" on;
          -moz-font-feature-settings: "ss01" on, "ss03" on;
          line-height: 34px;
        }
      </style>
      <linearGradient id="paint0_linear" x1="190.5" y1="302" x2="-64" y2="-172.5" gradientUnits="userSpaceOnUse">
        <stop stop-color="#44BCF0"/>
        <stop offset="0.428185" stop-color="#628BF3"/>
        <stop offset="1" stop-color="#A099FF"/>
      </linearGradient>
    </defs>
  </svg>`;
    const encoder = new TextEncoder();
    return encoder.encode(svg);
  } else {
    // Original flexible layout for custom style
    const metricsComment = `<!-- Text metrics: width=${metrics.width.toFixed(1)}px, height=${metrics.height.toFixed(1)}px, fontSize=${fontSize}px, font=${metrics.fontName || 'fallback'}, accurate=${metrics.isAccurate} -->
    <!-- Layout: textArea=${textAreaWidth}x${textAreaHeight}, padding=${paddingX}x${paddingY}, textPos=${finalTextX},${finalTextY} -->`;

    const textElement = `<text x="${finalTextX}" y="${finalTextY}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColorRGB}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${text}</text>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${metricsComment}
  ${backgroundElement}
  ${textElement}
</svg>`;
    const encoder = new TextEncoder();
    return encoder.encode(svg);
  }
}

// Export library functions
export {
  createDynamicSVGImage,
  measureTextAccurate,
  calculateFontSize,
  initializeFont
};
