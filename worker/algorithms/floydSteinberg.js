/**
 * Applies Floyd-Steinberg error diffusion dithering.
 * Converts to grayscale and dithers to pure black and white.
 * 
 * @param {Uint8ClampedArray} data - Pixel data (RGBA)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8ClampedArray} - Modified pixel data
 */
export function floydSteinberg(data, width, height) {
  const len = width * height;
  
  function getLuma(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  
  // Use Float32Array to preserve error values during diffusion
  const lumaBuffer = new Float32Array(len);
  
  // Convert to grayscale
  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    lumaBuffer[i] = getLuma(data[idx], data[idx + 1], data[idx + 2]);
  }

  // Apply Floyd-Steinberg dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = lumaBuffer[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      
      lumaBuffer[idx] = newPixel;
      const quantError = oldPixel - newPixel;
      
      // Distribute error to neighboring pixels:
      //       X   7/16
      //   3/16 5/16 1/16
      
      if (x + 1 < width) {
        lumaBuffer[idx + 1] += quantError * 7 / 16;
      }
      
      if (y + 1 < height) {
        if (x > 0) {
          lumaBuffer[idx + width - 1] += quantError * 3 / 16;
        }
        lumaBuffer[idx + width] += quantError * 5 / 16;
        if (x + 1 < width) {
          lumaBuffer[idx + width + 1] += quantError * 1 / 16;
        }
      }
    }
  }
  
  // Write back to RGBA data
  for (let i = 0; i < len; i++) {
    const finalVal = lumaBuffer[i] < 128 ? 0 : 255;
    const idx = i * 4;
    data[idx] = finalVal;     // R
    data[idx + 1] = finalVal; // G
    data[idx + 2] = finalVal; // B
    // Alpha channel remains unchanged
  }
  
  return data;
}
