var THREE = require('three');

module.exports = function(camera) {
  "use strict";
  
  var rotation = new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ');
  var startx = 0;
  var starty = 0;
  var mouseSpeedX = 0.01;
  var mouseSpeedY = 0.01;
  var unitVector = new THREE.Vector3(0, 0, 1);
  var distance = 50;
  var target = new THREE.Vector3(0, 0, 0);
  var maxPitch = Math.PI / 2 - 0.01;
  var minPitch = -Math.PI / 2 + 0.01;

  var mousedown = false;
  window.addEventListener('mousedown', function(e) {
    if (e.button === 2) {
      mousedown = true;
    }
  });

  window.addEventListener('mouseup', function(e) {
    if (e.button === 2) {
      mousedown = false;
    }
  });

  window.addEventListener('mousemove', function(e) {
    if (mousedown) {
      var diffx = e.clientX - startx;
      var diffy = e.clientY - starty;
      rotation.y += diffx * mouseSpeedX;
      rotation.x += diffy * mouseSpeedY;

      if (rotation.x < minPitch) rotation.x = minPitch;
      if (rotation.x > maxPitch) rotation.x = maxPitch;
      
      updateCamera();
    }
    startx = e.clientX;
    starty = e.clientY;
  });

  function updateCamera() {
    var position = unitVector.clone().applyEuler(rotation).setLength(distance).add(target);
    camera.position.copy(position);
    camera.lookAt(target);
  };

  updateCamera();
};