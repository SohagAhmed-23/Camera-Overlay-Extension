chrome.runtime.onInstalled.addListener(() => {
  console.log("ScreenCam Overlay Extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'stopCamera' && request.tabId) {
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      func: stopCameraScript
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
});

function stopCameraScript() {
  const video = document.getElementById('cameraStream');
  if (video) {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    const cameraOverlay = document.getElementById('cameraOverlay');
    if (cameraOverlay) {
      cameraOverlay.remove();
    }
  }
}


chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === "SEND_DATA") {
      const data = request.payload;

      // Do something with the received data, for example, storing it
      console.log("Received data:", data);

      // Optionally send a response back to the sender
      sendResponse({ success: true });

      // You can also send the data to the popup if it's open
      chrome.runtime.sendMessage({ type: "DATA_FROM_WEBPAGE", payload: data });
  }
});



chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});


// Listener for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received data in the background script:", message);

  // Process the received data (message)
  // ...

  // Respond back to the content script
  sendResponse({ success: true, data: "Processed data successfully" });
});
