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

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Deploy to Cloudflare
yarn deploy
```

## Testing

Open `test.html` in a browser with the dev server running to test the functionality.

## Known Issues

- Large background images may cause timeout issues
- Text positioning needs manual calculation for complex layouts