document.getElementById('ditherBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const algorithm = document.getElementById('algorithmSelect').value;
  
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'dither_page',
      algorithm: algorithm 
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError.message);
        }
    });
  }
});
