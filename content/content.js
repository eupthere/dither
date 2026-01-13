let worker;
let imageMap = new Map(); // id -> { resolve, reject, imgElement, originalSrc }
let msgIdCounter = 0;
let workerInitPromise;

function initWorker() {
  workerInitPromise = (async () => {
    try {
        const workerUrl = chrome.runtime.getURL('dist/worker.bundle.js');
        const res = await fetch(workerUrl);
        const blob = await res.blob();
        const objectURL = URL.createObjectURL(blob);
        worker = new Worker(objectURL);

        worker.onmessage = (e) => {
            const { id, data, error, success } = e.data;
            if (imageMap.has(id)) {
            const entry = imageMap.get(id);
            if (success) {
                entry.resolve(data);
            } else {
                entry.reject(new Error(error));
            }
            imageMap.delete(id);
            }
        };
    } catch (err) {
        console.error('Failed to initialize Dither worker:', err);
    }
  })();
}

async function loadImageWithCORS(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image with CORS"));
    img.src = src;
  });
}

async function processImage(img, algorithm = 'floyd-steinberg') {
  // 6.1 Identify
  if (img.width < 32 || img.height < 32) return;
  
  // Clean up old blob URL if re-processing
  if (img.dataset.blobUrl) {
    URL.revokeObjectURL(img.dataset.blobUrl);
  }
  
  // Restore original source if available
  const originalSrc = img.dataset.originalSrc || img.src;

  // Store original on first processing
  if (!img.dataset.originalSrc) {
    img.dataset.originalSrc = img.src;
  }
  
  // 6.2 Extract
  // We prefer loading a fresh copy with CORS enabled to avoid tainted canvas.
  let sourceImage = img;

  // If local data URI, no CORS needed.
  if (!originalSrc.startsWith('data:') && !originalSrc.startsWith('blob:')) {
    try {
      sourceImage = await loadImageWithCORS(originalSrc);
    } catch (e) {
      // If CORS load fails, fallback to original to see if it works (same-origin)
      sourceImage = img;
    }
  }

  // Ensure dimensions available
  if (!sourceImage.naturalWidth) return;
  
  const width = sourceImage.naturalWidth;
  const height = sourceImage.naturalHeight;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  try {
      ctx.drawImage(sourceImage, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      
      const msgId = `img-${msgIdCounter++}`;
      
      if (workerInitPromise) await workerInitPromise;

      const result = await new Promise((resolve, reject) => {
        imageMap.set(msgId, { resolve, reject, img });
        
        worker.postMessage({
          id: msgId,
          width,
          height,
          data: imageData.data,
          algorithm: algorithm
        }, [imageData.data.buffer]);
      });
      
      // 6.5 Replacement
      const newImageData = new ImageData(result, width, height);
      
      const resCanvas = document.createElement('canvas');
      resCanvas.width = width;
      resCanvas.height = height;
      const resCtx = resCanvas.getContext('2d');
      resCtx.putImageData(newImageData, 0, 0);
      
      return new Promise(resolve => {
         resCanvas.toBlob(blob => {
             if (!blob) {
               resolve();
               return;
             }
             const url = URL.createObjectURL(blob);
             
             // Force the browser to reload by clearing src first
             img.removeAttribute('src');
             img.removeAttribute('srcset');
             
             // Use a timeout to ensure the removal is processed
             setTimeout(() => {
               img.src = url;
               img.dataset.ditherProcessed = "true";
               img.dataset.blobUrl = url;
               resolve();
             }, 0);
         }, 'image/png');
      });

  } catch (err) {
      // SecurityError if tainted or other - silently skip
  }
}

async function ditherAllImages(algorithm = 'floyd-steinberg') {
  // If algorithm is 'original', restore all images
  if (algorithm === 'original') {
    restoreAllImages();
    return;
  }
  
  const images = Array.from(document.querySelectorAll('img'));
  const promises = images.map(img => processImage(img, algorithm));
  await Promise.all(promises);
}

function restoreAllImages() {
  const images = document.querySelectorAll('img[data-original-src]');
  images.forEach(img => {
    if (img.dataset.originalSrc) {
      img.src = img.dataset.originalSrc;
    }
    if (img.dataset.blobUrl) {
      URL.revokeObjectURL(img.dataset.blobUrl);
      delete img.dataset.blobUrl;
    }
    delete img.dataset.ditherProcessed;
  });
}

initWorker();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "dither_page") {
    const algorithm = request.algorithm || 'floyd-steinberg';
    ditherAllImages(algorithm).then(() => {
      sendResponse({ status: "done" });
    });
    return true; // Keep channel open
  }
});
