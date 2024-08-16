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
