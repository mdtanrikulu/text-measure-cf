# Text Measure CF

A Cloudflare Worker to demonstrate text measurement witohut Canvas requirement, which generates images with text overlays and background images.

## Features

- Generate PNG images with custom dimensions
- Add text overlays with customizable font size and positioning
- Support for background images (fetched from URLs)
- Returns images as base64 data URLs
- CORS-enabled API

## API Usage

### POST /

Generate an image with the following JSON parameters:

```json
{
  "text": "Hello World!",
  "width": 800,
  "height": 600,
  "fontSize": 48,
  "textColor": [0, 0, 0, 1],
  "backgroundColor": [255, 255, 255, 1],
  "backgroundImageUrl": "https://example.com/image.jpg",
  "textX": 400,
  "textY": 300
}
```

#### Parameters

- `text` (string): Text to overlay on the image
- `width` (number): Image width in pixels (default: 800)
- `height` (number): Image height in pixels (default: 600)
- `fontSize` (number): Font size in pixels (default: 48)
- `textColor` (array): RGBA color values [r, g, b, a] (default: [0, 0, 0, 1])
- `backgroundColor` (array): RGBA background color (default: [255, 255, 255, 1])
- `backgroundImageUrl` (string): URL of background image (optional)
- `textX` (number): X position of text (default: centered)
- `textY` (number): Y position of text (default: centered)

#### Response

```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "base64": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

## Development

The project is structured as a library with a demo implementation:

- **Library**: Core text measurement and SVG generation functions in `src/`
- **Demo**: Cloudflare Worker implementation in `demo/`

### Library Development

```bash
# Install dependencies
yarn install

# The library exports functions from src/index.js:
# - createDynamicSVGImage()
# - measureTextAccurate()
# - calculateFontSize()
# - initializeFont()
```

### Demo Worker Development

```bash
# Start development server for the demo worker
yarn dev

# This runs the worker from demo/worker.js which:
# - Serves the demo HTML interface at /
# - Provides the API endpoint for image generation
```

### Deployment

#### Deploy Demo Worker
```bash
# Deploy the demo worker to Cloudflare
yarn deploy

# This deploys demo/worker.js as a Cloudflare Worker
```

#### Deploy Demo Pages (Optional)
```bash
# If you want to serve the demo HTML as static pages:
# 1. Upload demo/index.html to any static hosting service
# 2. Update the WORKER_URL in the HTML to point to your deployed worker
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
