// Simplified - no longer need CanvasKit polyfills

import opentype from 'opentype.js';

let loadedFont = null;

async function initializeFont() {
  if (!loadedFont) {
    try {
      console.log('Loading Noto Sans font for accurate text measurement...');
      // Using Google Fonts API to get a font that supports emojis and international text
      // First try to get the actual font URL from Google Fonts CSS
      const fontFamilyUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400&display=swap';
      const cssResponse = await fetch(fontFamilyUrl, {
        headers: {
          // Use an older browser user agent to get WOFF format instead of WOFF2
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1'
        }
      });
      
      if (!cssResponse.ok) {
        throw new Error(`Failed to fetch font CSS: ${cssResponse.status}`);
      }
      
      const cssText = await cssResponse.text();
      const urlMatch = cssText.match(/url\(([^)]+)\)/);
      
      if (!urlMatch) {
        throw new Error('Could not extract font URL from CSS');
      }
      
      const fontUrl = urlMatch[1].replace(/['"]/g, ''); // Remove quotes
      
      const response = await fetch(fontUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch font: ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      loadedFont = opentype.parse(buffer);
      
      console.log(`Font loaded: ${loadedFont.names.fontFamily?.en || 'Unknown'}`);
    } catch (error) {
      console.warn('Failed to load OpenType font, falling back to mathematical approximation:', error.message);
      loadedFont = null;
    }
  }
  return loadedFont;
}

// Accurate text measurement using OpenType.js (supports emojis, international text)
async function measureTextAccurate(text, fontSize = 48, fontFamily = 'Arial') {
  const font = await initializeFont();
  
  if (font) {
    try {
      // Get text width using OpenType.js
      const textWidth = font.getAdvanceWidth(text, fontSize);
      
      // Get font metrics
      const fontScale = 1 / font.unitsPerEm * fontSize;
      const ascent = font.ascender * fontScale;
      const descent = Math.abs(font.descender * fontScale);
      const height = ascent + descent;
      
      return {
        width: textWidth,
        height: height,
        actualBoundingBoxAscent: ascent,
        actualBoundingBoxDescent: descent,
        fontName: font.names.fontFamily?.en || 'Unknown',
        isAccurate: true
      };
    } catch (error) {
      console.warn('OpenType measurement failed, using fallback:', error.message);
    }
  }
  
  // Fallback to mathematical approximation
  return measureTextFallback(text, fontSize, fontFamily);
}

// Fallback text measurement using mathematical approximations
function measureTextFallback(text, fontSize = 48, fontFamily = 'Arial') {
  // Approximate character widths for common fonts (in em units)
  const charWidths = {
    // Narrow characters
    'i': 0.3, 'l': 0.3, 'j': 0.3, 'f': 0.35, 't': 0.4, 'r': 0.4,
    // Regular width characters  
    'a': 0.55, 'b': 0.6, 'c': 0.5, 'd': 0.6, 'e': 0.55, 'g': 0.6, 'h': 0.6, 'k': 0.55, 'n': 0.6, 'o': 0.6, 'p': 0.6, 'q': 0.6, 's': 0.5, 'u': 0.6, 'v': 0.55, 'x': 0.55, 'y': 0.55, 'z': 0.5,
    // Wide characters
    'w': 0.8, 'm': 0.9,
    // Uppercase letters (generally wider)
    'A': 0.7, 'B': 0.65, 'C': 0.7, 'D': 0.7, 'E': 0.6, 'F': 0.55, 'G': 0.75, 'H': 0.7, 'I': 0.3, 'J': 0.4, 'K': 0.65, 'L': 0.55, 'M': 0.85, 'N': 0.7, 'O': 0.75, 'P': 0.6, 'Q': 0.75, 'R': 0.65, 'S': 0.6, 'T': 0.6, 'U': 0.7, 'V': 0.7, 'W': 0.95, 'X': 0.65, 'Y': 0.65, 'Z': 0.6,
    // Numbers
    '0': 0.6, '1': 0.6, '2': 0.6, '3': 0.6, '4': 0.6, '5': 0.6, '6': 0.6, '7': 0.6, '8': 0.6, '9': 0.6,
    // Punctuation and spaces
    ' ': 0.3, '.': 0.3, ',': 0.3, '!': 0.3, '?': 0.5, ':': 0.3, ';': 0.3, '-': 0.35, '_': 0.5, '(': 0.4, ')': 0.4, '[': 0.4, ']': 0.4, '{': 0.4, '}': 0.4, '/': 0.3, '\\': 0.3, '|': 0.3, '"': 0.4, "'": 0.25, '&': 0.7, '@': 0.9, '#': 0.6, '$': 0.6, '%': 0.9, '^': 0.5, '*': 0.4, '+': 0.6, '=': 0.6, '<': 0.6, '>': 0.6, '~': 0.6, '`': 0.3
  };

  let totalWidth = 0;
  for (let char of text) {
    const charCode = char.charCodeAt(0);
    let charWidth;
    
    if (charWidths[char]) {
      charWidth = charWidths[char];
    } else if (
      // Japanese Hiragana, Katakana, and Kanji ranges
      (charCode >= 0x3040 && charCode <= 0x309F) || // Hiragana
      (charCode >= 0x30A0 && charCode <= 0x30FF) || // Katakana  
      (charCode >= 0x4E00 && charCode <= 0x9FAF) || // CJK Ideographs (Kanji)
      (charCode >= 0x3400 && charCode <= 0x4DBF) || // CJK Extension A
      // Chinese characters
      (charCode >= 0x2E80 && charCode <= 0x2EFF) || // CJK Radicals
      // Korean Hangul
      (charCode >= 0xAC00 && charCode <= 0xD7AF) || // Hangul Syllables
      // Emoji ranges (many are wide) - expanded ranges
      (charCode >= 0x1F000 && charCode <= 0x1FFFF) || // Extended emoji blocks
      (charCode >= 0x2600 && charCode <= 0x26FF) ||   // Miscellaneous Symbols
      (charCode >= 0x2700 && charCode <= 0x27BF)      // Dingbats
    ) {
      charWidth = 1.0; // CJK and emoji characters are typically full-width
    } else {
      charWidth = 0.6; // Default for other unknown characters
    }
    
    totalWidth += charWidth;
  }

  return {
    width: totalWidth * fontSize,
    height: fontSize * 1.2, // Approximate line height
    actualBoundingBoxAscent: fontSize * 0.8,
    actualBoundingBoxDescent: fontSize * 0.2,
    isAccurate: false
  };
}

// Calculate optimal font size to fit text within constraints
async function calculateFontSize(text, maxWidth, maxHeight = null, minFontSize = 12, maxFontSize = 100) {
  let fontSize = maxFontSize;
  
  while (fontSize >= minFontSize) {
    const metrics = await measureTextAccurate(text, fontSize);
    
    // Add a more aggressive safety margin for international characters and emojis (15% vs 5%)
    const hasIntlChars = [...text].some(char => {
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
    const safetyMargin = hasIntlChars ? 0.85 : 0.95;
    const safeWidth = maxWidth * safetyMargin;
    
    console.log(`Font size ${fontSize}: measured=${metrics.width.toFixed(1)}, safeWidth=${safeWidth.toFixed(1)}, maxWidth=${maxWidth.toFixed(1)}, hasIntl=${hasIntlChars}`);
    
    if (metrics.width <= safeWidth && (!maxHeight || metrics.height <= maxHeight)) {
      return { fontSize, metrics };
    }
    
    fontSize -= 1;
  }
  
  return { fontSize: minFontSize, metrics: await measureTextAccurate(text, minFontSize) };
}

async function createImageWithTextAndBackground(options = {}) {
  // Use SVG approach with accurate OpenType.js text measurement
  const data = await createDynamicSVGImage(options);
  return { data, format: 'svg' };
}

async function createDynamicSVGImage(options = {}) {
  const {
    width = 800,
    height = 600,
    text = 'Hello World',
    textColor = [255, 255, 255, 1],
    backgroundColor = [255, 255, 255, 1],
    gradientStart = [102, 126, 234, 1],
    gradientEnd = [118, 75, 162, 1],
    useGradient = true,
    backgroundImageUrl = null,
    textX = null,
    textY = null,
    maxTextWidth = null,
    autoFontSize = true,
    ensStyle = true // Enable ENS-like styling by default
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
  const paddingMultiplier = hasInternationalChars ? 0.6 : 0.8;
  const textAreaWidth = maxTextWidth || (width * paddingMultiplier);
  const textAreaHeight = height * 0.6;
  const paddingX = (width - textAreaWidth) / 2;
  const paddingY = (height - textAreaHeight) / 2;
  
  // Calculate optimal font size if auto-sizing is enabled
  let fontSize = options.fontSize || 48;
  let metrics = null;
  if (autoFontSize && text && text.trim()) {
    const result = await calculateFontSize(text, textAreaWidth, textAreaHeight);
    fontSize = result.fontSize;
    metrics = result.metrics;
    console.log(`Auto-calculated font size: ${fontSize}px for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (${metrics.isAccurate ? 'OpenType' : 'fallback'} measurement)`);
  } else {
    metrics = await measureTextAccurate(text, fontSize);
  }

  // text at bottom center
  let finalTextX, finalTextY;
  let textAnchor = 'middle';
  let dominantBaseline = 'alphabetic';
  
  if (textX !== null && textY !== null) {
    // Use explicit positioning if provided
    finalTextX = textX;
    finalTextY = textY;
  } else if (ensStyle) {
    // center horizontally, position near bottom with padding
    finalTextX = width / 2;
    finalTextY = height - (height * 0.15); // 15% from bottom
  } else {
    // Default: center both ways
    finalTextX = width / 2;
    finalTextY = height / 2;
    dominantBaseline = 'central';
  }
  
  const textColorRGB = `rgb(${textColor[0]}, ${textColor[1]}, ${textColor[2]})`;
  
  // Create background element with gradient or solid color
  let backgroundElement = '';
  if (backgroundImageUrl) {
    backgroundElement = `<image href="${backgroundImageUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
  } else if (useGradient) {
    const gradientStartRGB = `rgb(${gradientStart[0]}, ${gradientStart[1]}, ${gradientStart[2]})`;
    const gradientEndRGB = `rgb(${gradientEnd[0]}, ${gradientEnd[1]}, ${gradientEnd[2]})`;
    backgroundElement = `
    <defs>
      <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${gradientStartRGB};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gradientEndRGB};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg-gradient)" rx="${ensStyle ? 20 : 0}"/>`;
  } else {
    const bgColorRGB = `rgb(${backgroundColor[0]}, ${backgroundColor[1]}, ${backgroundColor[2]})`;
    backgroundElement = `<rect width="${width}" height="${height}" fill="${bgColorRGB}" rx="${ensStyle ? 20 : 0}"/>`;
  }

  // Add comprehensive text metrics and layout info as comments
  const metricsComment = `<!-- Text metrics: width=${metrics.width.toFixed(1)}px, height=${metrics.height.toFixed(1)}px, fontSize=${fontSize}px, font=${metrics.fontName || 'fallback'}, accurate=${metrics.isAccurate} -->
  <!-- Layout: textArea=${textAreaWidth}x${textAreaHeight}, padding=${paddingX}x${paddingY}, textPos=${finalTextX},${finalTextY} -->
  <!-- Style: ensStyle=${ensStyle}, anchor=${textAnchor}, baseline=${dominantBaseline} -->`;

  // text with subtle shadow effect
  const textElement = ensStyle ? 
    `<text x="${finalTextX}" y="${finalTextY}" font-family="-apple-system, BlinkMacSystemFont, 'Satoshi', 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="700" fill="${textColorRGB}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">${text}</text>` :
    `<text x="${finalTextX}" y="${finalTextY}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColorRGB}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${text}</text>`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${metricsComment}
  ${backgroundElement}
  ${textElement}
</svg>`;

  const encoder = new TextEncoder();
  return encoder.encode(svg);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      if (request.method === 'GET') {
        const url = new URL(request.url);
        
        // Serve demo page
        if (url.pathname === '/' || url.pathname === '/demo') {
          try {
            const { demoHTML } = await import('./demo-content.js');
            return new Response(demoHTML, {
              headers: {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
              },
            });
          } catch (error) {
            console.error('Failed to load demo HTML:', error);
          }
        }
        
        return new Response(`
🎨 OpenType.js SVG Generator API

🌟 Features:
✅ Accurate text measurement with OpenType.js
✅ Universal emoji & international text support (🌍 مرحبا 你好)
✅ Dynamic font sizing with real font metrics
✅ Background image support
✅ Fast SVG generation (no WASM overhead)
✅ Interactive demo interface

🚀 Endpoints:
- GET / or /demo - Interactive demo interface  
- POST / - Generate SVG with JSON data

💻 API Usage:
curl -X POST http://localhost:8787 \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello 🌍!", "width": 400, "height": 200, "autoFontSize": true}'

🎯 Try the demo: http://localhost:8787/
        `, {
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (request.method !== 'POST') {
        return new Response('Method not allowed', { 
          status: 405,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      const contentType = request.headers.get('Content-Type') || '';
      let options = {};

      if (contentType.includes('application/json')) {
        options = await request.json();
      } else {
        const formData = await request.formData();
        options = {};
        for (const [key, value] of formData.entries()) {
          if (key === 'width' || key === 'height' || key === 'fontSize' || key === 'textX' || key === 'textY') {
            options[key] = parseInt(value) || undefined;
          } else if (key === 'textColor' || key === 'backgroundColor') {
            try {
              options[key] = JSON.parse(value);
            } catch {
              options[key] = value;
            }
          } else {
            options[key] = value;
          }
        }
      }

      const result = await createImageWithTextAndBackground(options);
      const base64Data = arrayBufferToBase64(result.data);
      
      const mimeType = result.format === 'svg' ? 'image/svg+xml' : 'image/png';

      const responseData = {
        success: true,
        image: `data:${mimeType};base64,${base64Data}`,
        base64: base64Data,
        format: result.format
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Error generating image:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};