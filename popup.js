let mediaRecorder;
let recordedChunks = [];
let stream;

document.getElementById('startBtn').addEventListener('click', startRecording);
document.getElementById('stopBtn').addEventListener('click', stopRecording);

async function uploadFileToMoodle(fileBlob, filename) {
  const token = '8f5310551bb8eaeecac67bf5b0ce4257'; // Replace with your Moodle API token
  const siteUrl = 'http://localhost/moodle'; // Base URL of your Moodle site

  try {
    // Prepare the URL with the authentication token
    const uploadUrl = `${siteUrl}/webservice/upload.php?token=${token}`;

    // Create a FormData object to hold the file and other parameters
    const formData = new FormData();
    formData.append('file_1', fileBlob, filename);
    formData.append('filepath', '/'); // Optional: specify the file path
    formData.append('itemid', '0'); // Optional: specify the itemid, 0 creates a new one

    // Send the POST request to upload the file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    // Check if response is okay
    if (!uploadResponse.ok) {
      throw new Error(`File upload failed: ${uploadResponse.statusText}`);
    }

    // Parse and log the JSON response
    const uploadResult = await uploadResponse.json();
    console.log('Upload Result:', uploadResult);

    // Handle the response further as needed, such as saving the itemid for future use
    // uploadResult will include itemid, filepath, filename, etc.

  } catch (error) {
    console.error('Upload Error:', error);
  }
}

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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      video.srcObject = stream;
    }).catch((error) => {
      console.error('Error accessing camera:', error);
    });
  }
}

function startScreenRecording() {
  chrome.tabCapture.capture({ video: true, audio: true }, function(capturedStream) {
    if (chrome.runtime.lastError) {
      console.error('Capture error:', chrome.runtime.lastError);
      return;
    }
    if (!capturedStream) {
      console.error('Failed to capture stream');
      return;
    }
    stream = capturedStream;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = function() {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      
      // Directly upload to Moodle
      uploadFileToMoodle(blob, 'screen-recording.webm');
      
      resetRecordingState();
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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "DATA_FROM_WEBPAGE") {
      const data = request.payload;

      // Use the data as needed in the popup
      console.log("Data received in popup:", data);
      document.getElementById('displayName').textContent = `Name: ${data.name}`;
      document.getElementById('displayId').textContent = `ID: ${data.id}`;
  }
});
