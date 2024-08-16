let mediaRecorder;
let recordedChunks = [];
let stream;

document.getElementById('startBtn').addEventListener('click', startRecording);
document.getElementById('stopBtn').addEventListener('click', stopRecording);

function startRecording() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    
    // Inject a script to create the overlay and start the camera
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: createCameraOverlay
    }, () => {
      setTimeout(startScreenRecording, 1000); // Ensure the camera overlay has started
    });
  });
}

function createCameraOverlay() {
  if (!document.getElementById('cameraOverlay')) {
    const cameraOverlay = document.createElement('div');
    cameraOverlay.id = 'cameraOverlay';

    const video = document.createElement('video');
    video.id = 'cameraStream';
    video.autoplay = true;

    cameraOverlay.appendChild(video);
    document.body.appendChild(cameraOverlay);

    // Request camera access and stream to video element
    navigator.mediaDevices.getUserMedia({ video: true, audio: true}).then((stream) => {
      video.srcObject = stream;
    }).catch((error) => {
      console.error('Error accessing camera:', error);
    });
  }
}

function startScreenRecording() {
  chrome.tabCapture.capture({ video: true, audio: true }, function(capturedStream) {
    if (!capturedStream) {
      console.error('Failed to capture stream');
      return;
    }
    stream = capturedStream; // Store the stream for later use
    recordedChunks = []; // Reset recorded chunks for new recording
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = function() {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url: url,
        filename: 'screen-recording.webm',
        saveAs: true
      });
      resetRecordingState(); // Reset state after recording stops
    };

    mediaRecorder.start();
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
  });
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: removeCameraOverlay
    });
  });
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

function removeCameraOverlay() {
  const video = document.getElementById('cameraStream');
  if (video) {
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    const cameraOverlay = document.getElementById('cameraOverlay');
    if (cameraOverlay) {
      cameraOverlay.remove();
    }
  }
}

function resetRecordingState() {
  mediaRecorder = null;
  stream = null;
  recordedChunks = [];
}
