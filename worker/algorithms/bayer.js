/**
 * Applies Ordered Bayer dithering.
 * 
 * @param {Uint8ClampedArray} data - Pixel data (RGBA)
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
export function bayer(data, width, height) {
    // 4x4 Bayer Matrix
    // Values 0-15. 
    // We can normalize this threshold logic.
    // Normalized = value / 16.
    // Pixel < Normalized * 255 ? 0 : 255
    const matrix = [
        1,  9,  3, 11,
        13, 5, 15, 7,
        4, 12, 2, 10,
        16, 8, 14, 6
    ];

    const len = width * height;

    function getLuma(r, g, b) {
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const outputIdx = idx;

            const luma = getLuma(data[idx], data[idx + 1], data[idx + 2]);
            
            // Map x,y to matrix 4x4
            const mx = x % 4;
            const my = y % 4;
            const mVal = matrix[my * 4 + mx];
            
            // Normalize matrix value to 0-255 range approximately
            // mVal is 1..16. 
            // Threshold = (mVal / 17) * 255
            const threshold = (mVal / 17) * 255;

            const finalVal = luma < threshold ? 0 : 255;

            data[outputIdx] = finalVal;
            data[outputIdx + 1] = finalVal;
            data[outputIdx + 2] = finalVal;
        }
    }
    
    return data;
}
