var THREE = require('three');

module.exports = function(camera, input) {
  "use strict";

  var rotation = new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ');
  var lastMouse = new THREE.Vector2();
  var mouseSpeedX = 4;
  var mouseSpeedY = 4;
  var unitVector = new THREE.Vector3(0, 0, 1);
  var distance = 100;
  var target = new THREE.Vector3(0, 0, 0);
  var maxPitch = Math.PI / 2 - 0.01;
  var minPitch = -Math.PI / 2 + 0.01;

  function tick() {
    if (input.mouseHold(2)) {
      var diff = new THREE.Vector2().subVectors(input.mouse, lastMouse);
      rotation.y += diff.x * mouseSpeedX;
      rotation.x -= diff.y * mouseSpeedY;

      if (rotation.x < minPitch) rotation.x = minPitch;
      if (rotation.x > maxPitch) rotation.x = maxPitch;

      updateCamera();
    }

    lastMouse.copy(input.mouse);
  };

  function updateCamera() {
    var position = unitVector.clone().applyEuler(rotation).setLength(distance).add(target);
    camera.position.copy(position);
    camera.lookAt(target);
  };

  updateCamera();

  return {
    tick: tick
  }
};

module.exports.$inject = ['input'];