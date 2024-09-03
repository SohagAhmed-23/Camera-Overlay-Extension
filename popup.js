let mediaRecorder;
let recordedChunks = [];
let stream;

document.getElementById('startBtn').addEventListener('click', startRecording);
document.getElementById('stopBtn').addEventListener('click', stopRecording);

// async function fetchCsrfToken() {
//   try {
//     const response = await fetch('http://localhost/moodle/tokenGenerate.php');
    
//     if (!response.status) {
//       throw new Error('Failed to fetch CSRF token');
//     }
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error('Error fetching CSRF token:', error);
//     return null;
//   }
// }

async function uploadFileToMoodle(fileBlob, filename) {
  const siteUrl = 'http://localhost/moodle/test1.php'; // Replace with your Moodle site URL

  try {
    // Create a FormData object to hold the file and other parameters
    const formData = new FormData();
    formData.append('file', fileBlob, filename); // Adjust the input name if needed
    formData.append('filepath', '/'); // Optional: specify the file path
    formData.append('itemid', '0'); // Optional: include additional data if necessary

    // Send the POST request to upload the file
    const uploadResponse = await fetch(siteUrl, {
      method: 'POST',
      body: formData,
    });

    // Check if the response is okay
    if (!uploadResponse.ok) {
      throw new Error(`File upload failed: ${uploadResponse.statusText}`);
    }

    // Parse the JSON response
    const uploadResult = await uploadResponse.json();
    console.log('Upload Result:', uploadResult);
    // Handle the response further as needed
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
  chrome.desktopCapture.chooseDesktopMedia(['screen'], (streamId) => {
    if (!streamId) {
      console.error('Failed to get stream ID');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId
        }
      }
    }).then((capturedStream) => {
      console.log("Stream is on");

      // Ensure you use the local variable for the stream
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
    }).catch((err) => {
      console.error('Error capturing screen:', err);
    });
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
