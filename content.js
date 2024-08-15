let cameraOverlay = document.createElement('div');
cameraOverlay.id = 'cameraOverlay';
document.body.appendChild(cameraOverlay);

navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
  .then(function (stream) {
    let video = document.createElement('video');
    video.id = 'cameraStream';
    video.srcObject = stream;
    video.autoplay = true;
    cameraOverlay.appendChild(video);
  })
  .catch(function (error) {
    console.error("Error accessing the camera: ", error);
    alert("Camera access was denied. Please allow camera access and try again.");
  });

// Make the overlay draggable
cameraOverlay.onmousedown = function(event) {
  event.preventDefault();
  let shiftX = event.clientX - cameraOverlay.getBoundingClientRect().left;
  let shiftY = event.clientY - cameraOverlay.getBoundingClientRect().top;

  function moveAt(pageX, pageY) {
    cameraOverlay.style.left = pageX - shiftX + 'px';
    cameraOverlay.style.top = pageY - shiftY + 'px';
  }

  function onMouseMove(event) {
    moveAt(event.pageX, event.pageY);
  }

  document.addEventListener('mousemove', onMouseMove);

  cameraOverlay.onmouseup = function() {
    document.removeEventListener('mousemove', onMouseMove);
    cameraOverlay.onmouseup = null;
  };
};

cameraOverlay.ondragstart = function() {
  return false;
};
