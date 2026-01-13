import { floydSteinberg } from './algorithms/floydSteinberg.js';
import { bayer } from './algorithms/bayer.js';

self.onmessage = function(e) {
  const { id, width, height, data, algorithm } = e.data;
  
  let processedData;
  
  try {
    if (algorithm === 'bayer') {
      processedData = bayer(data, width, height);
    } else {
      // Default to floyd-steinberg
      processedData = floydSteinberg(data, width, height);
    }
    
    // Send back
    self.postMessage({
      id,
      data: processedData,
      success: true
    }, [processedData.buffer]); // Transferable
    
  } catch (err) {
    console.error('Worker error:', err);
    self.postMessage({
      id,
      error: err.message,
      success: false
    });
  }
};
