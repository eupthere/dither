# Dither

A Chrome extension that applies dithering algorithms to all images on a webpage, converting them to black and white with various artistic effects.

## Features

- **Multiple Algorithms**: Choose between Floyd-Steinberg error diffusion and Bayer ordered dithering
- **One-Click Processing**: Dither all images on the current page with a single button click
- **Reversible**: Restore original images anytime
- **Fast Processing**: Uses Web Workers for non-blocking image processing
- **Privacy-Focused**: All processing happens locally in your browser

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/eupthere/dither.git
   cd dither
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dither-chrome-extension` folder

## Usage

1. Navigate to any webpage with images
2. Click the Dither extension icon in your toolbar
3. Select an algorithm from the dropdown:
   - **Original (Restore)**: Restore images to their original state
   - **Floyd-Steinberg**: Error diffusion dithering with smooth gradients
   - **Bayer (Ordered)**: Pattern-based dithering with a textured look
4. Click "Apply Dithering"
5. All processable images on the page will be converted to dithered black and white

## How It Works

The extension uses a multi-component architecture:

- **Popup**: User interface for selecting algorithms and triggering dithering
- **Content Script**: Injected into web pages to identify and process images
- **Web Worker**: Performs CPU-intensive dithering calculations off the main thread
- **Algorithms**: Implements Floyd-Steinberg and Bayer dithering techniques

### Processing Flow

1. Content script identifies all `<img>` elements on the page
2. For each image, it extracts pixel data to a canvas
3. Pixel data is sent to a dedicated Web Worker
4. Worker applies the selected dithering algorithm
5. Processed image is converted to a blob and replaces the original
6. Original image URLs are preserved for restoration

## Algorithms

### Floyd-Steinberg
Error diffusion dithering that distributes quantization error to neighboring pixels, creating smooth gradients and natural-looking results.

### Bayer (Ordered)
Pattern-based dithering using a threshold matrix, producing a distinctive crosshatch texture reminiscent of newspaper prints.

## Limitations

- **Minimum Image Size**: Images smaller than 32×32 pixels are skipped
- **CORS Restrictions**: Cross-origin images without proper CORS headers cannot be processed due to browser security policies. This is a fundamental browser limitation that affects any client-side image processing extension.
  - You may see `Access-Control-Allow-Origin` errors in the console for some images
  - These errors are expected and the extension gracefully skips these images
  - Only images from the same domain or servers that send CORS headers can be dithered
  - This cannot be bypassed without requesting invasive `host_permissions` which would require "Read and change all your data on all websites" permission

## Development

### Build Commands

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Project Structure

```
dither-chrome-extension/
├── manifest.json          # Extension manifest
├── popup/                 # Extension popup UI
│   ├── popup.html
│   └── popup.js
├── content/              # Content script
│   └── content.js
├── worker/               # Web Worker for image processing
│   ├── dither.worker.js
│   └── algorithms/
│       ├── floydSteinberg.js
│       └── bayer.js
├── dist/                 # Built bundles (generated)
└── rollup.config.js      # Build configuration
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
