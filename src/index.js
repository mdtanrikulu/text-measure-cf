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
    const charWidth = charWidths[char] || 0.6; // Default width for unknown characters
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
    
    if (metrics.width <= maxWidth && (!maxHeight || metrics.height <= maxHeight)) {
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
    textColor = [0, 0, 0, 1],
    backgroundColor = [255, 255, 255, 1],
    backgroundImageUrl = null,
    textX = null,
    textY = null,
    maxTextWidth = null, // Allow custom text area width
    autoFontSize = true  // Enable automatic font sizing
  } = options;

  // Calculate text area (leave some padding)
  const textAreaWidth = maxTextWidth || (width * 0.8);
  const textAreaHeight = height * 0.6;
  const paddingX = (width - textAreaWidth) / 2; // Calculate actual padding used
  
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

  // Position text within the calculated text area bounds
  const finalTextX = textX !== null ? textX : paddingX + (textAreaWidth / 2);
  const finalTextY = textY !== null ? textY : height / 2;
  
  const bgColorRGB = `rgb(${backgroundColor[0]}, ${backgroundColor[1]}, ${backgroundColor[2]})`;
  const textColorRGB = `rgb(${textColor[0]}, ${textColor[1]}, ${textColor[2]})`;

  let backgroundElement = '';
  if (backgroundImageUrl) {
    backgroundElement = `<image href="${backgroundImageUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
  }

  // Add text metrics info as comment
  const metricsComment = `<!-- Text metrics: width=${metrics.width.toFixed(1)}px, height=${metrics.height.toFixed(1)}px, fontSize=${fontSize}px, font=${metrics.fontName || 'fallback'}, accurate=${metrics.isAccurate} -->
  <!-- Layout: textArea=${textAreaWidth}x${textAreaHeight}, paddingX=${paddingX}, textPos=${finalTextX},${finalTextY} -->`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${metricsComment}
  <rect width="${width}" height="${height}" fill="${bgColorRGB}"/>
  ${backgroundElement}
  <text x="${finalTextX}" y="${finalTextY}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColorRGB}" text-anchor="middle" dominant-baseline="central">${text}</text>
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