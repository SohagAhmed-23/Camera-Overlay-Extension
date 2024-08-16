if (!document.getElementById('cameraOverlay')) {
  const cameraOverlay = document.createElement('div');
  cameraOverlay.id = 'cameraOverlay';

  const video = document.createElement('video');
  video.id = 'cameraStream';
  video.autoplay = true;

  cameraOverlay.appendChild(video);
  document.body.appendChild(cameraOverlay);

  // Request camera access and stream to video element
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
  }).catch((error) => {
    console.error('Error accessing camera:', error);
  });
}
