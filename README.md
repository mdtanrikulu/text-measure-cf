# Adaptive Layout Composer

An adaptive layout composer with precise text measurement, dynamic font sizing, and intelligent positioning for international text and emojis.

## Features

- Generate SVG images with custom dimensions
- Accurate text measurement using OpenType.js
- Support for international text (CJK, Arabic, Hebrew, etc.) and emojis
- Dynamic font sizing that fits text within constraints
- Support for background images (fetched from URLs)
- Returns SVG data as Uint8Array or base64
- Optimized for Cloudflare Workers

## Installation

```bash
npm install adaptive-layout-composer
```

## Usage

### Basic Usage

```javascript
import { createDynamicSVGImage } from 'adaptive-layout-composer';

// Generate SVG with auto font sizing
const svgData = await createDynamicSVGImage({
  text: "Hello 🌍 World!",
  width: 400,
  height: 200,
  autoFontSize: true,
  ensStyle: true
});

// Convert to base64 for data URL
const base64 = btoa(String.fromCharCode(...svgData));
const dataUrl = `data:image/svg+xml;base64,${base64}`;
```

### Using Custom Fonts

For more accurate text measurement and custom fonts in your SVG:

```javascript
import { initializeFont, createDynamicSVGImage } from 'adaptive-layout-composer';
import myFont from './fonts/MyFont.ttf';

// Load font for accurate text measurement (OpenType.js)
await initializeFont(myFont); // ArrayBuffer, URL, or base64

// Convert font to base64 for embedding in SVG
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

// Generate SVG with embedded custom font
const svgData = await createDynamicSVGImage({
  text: "Custom Font Text",
  width: 400,
  height: 200,
  fontFamily: 'MyFont',
  fontBase64: arrayBufferToBase64(myFont),
  autoFontSize: true
});
```

### API Reference

#### `createDynamicSVGImage(options)`

Generate an SVG image with the following options:

```javascript
{
  text: "Hello World!",           // Text to render
  width: 270,                     // Image width in pixels
  height: 270,                    // Image height in pixels
  textColor: [255, 255, 255, 1],  // RGBA text color
  backgroundImageUrl: "https://example.com/image.jpg", // Optional background
  autoFontSize: true,             // Auto-calculate font size to fit
  maxFontSize: 68,                // Maximum font size when auto-sizing
  fontSize: 48,                   // Manual font size (if autoFontSize: false)
  ensStyle: true,                 // Use ENS-style layout with logo
  textX: 100,                     // Manual X position
  textY: 100,                     // Manual Y position
  maxTextWidth: 200,              // Maximum text width
  fontFamily: 'sans-serif',       // Font family name (used for both embedded and system fonts)
  fontBase64: 'base64data...'     // Optional: base64 font data to embed with fontFamily name
}
```

#### Other Functions

- `initializeFont(fontSource)` - Load a font for accurate text measurement
  - Accepts: URL string, base64 string, ArrayBuffer, or Uint8Array
  - Returns: OpenType font object or null
- `measureTextAccurate(text, fontSize, fontFamily)` - Get accurate text measurements using loaded font
- `calculateFontSize(text, maxWidth, maxHeight, minSize, maxSize)` - Calculate optimal font size to fit text

## Development

```bash
# Install dependencies
yarn install

# The library exports functions from src/index.js:
# - createDynamicSVGImage()
# - measureTextAccurate()
# - calculateFontSize()
# - initializeFont()
```

### Using as a Library

Import the library functions in your own Cloudflare Worker:

```javascript
import { createDynamicSVGImage } from './src/index.js';

export default {
  async fetch(request) {
    const svgData = await createDynamicSVGImage({
      text: "Hello World",
      width: 400,
      height: 200
    });

    return new Response(svgData, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}
```
