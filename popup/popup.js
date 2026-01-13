const messageDiv = document.getElementById('message');

function showMessage(text, type = 'info') {
  messageDiv.textContent = text;
  messageDiv.className = type;
  messageDiv.style.display = 'block';
}

document.getElementById('ditherBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const algorithm = document.getElementById('algorithmSelect').value;
  
  messageDiv.style.display = 'none';
  
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'dither_page',
      algorithm: algorithm 
    }, (response) => {
        if (chrome.runtime.lastError) {
            showMessage('Error: ' + chrome.runtime.lastError.message, 'warning');
            return;
        }
        
        if (response?.stats) {
          const s = response.stats;
          
          if (s.restored) {
            showMessage('Images restored to original', 'success');
          } else {
            let msg = `Processed ${s.processed} of ${s.total} images`;
            let type = 'success';
            
            if (s.corsErrors > 0) {
              msg += `\n - ${s.corsErrors} skipped (CORS policy)`;
              type = 'warning';
            }
            if (s.tooSmall > 0) {
              msg += `\n - ${s.tooSmall} too small (<32px)`;
            }
            
            showMessage(msg, type);
          }
        }
    });
  }
});
