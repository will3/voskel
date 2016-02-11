var gravityUtils = require('../utils/gravityutils');

module.exports = function(object, app, input, camera) {
  "use strict";

  var character = null;

  var lastGravity = null;

  var rigidBody = null;

  function tick() {
    var forwardAmount = 0;
    if (input.keyHold('w')) forwardAmount += 1;
    if (input.keyHold('s')) forwardAmount -= 1;

    var rightAmount = 0;
    if (input.keyHold('d')) rightAmount += 1;
    if (input.keyHold('a')) rightAmount -= 1;

    var normal = gravityUtils.getGravity(object.position).dir.clone().multiplyScalar(-1);
    var up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    var right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    var move = up.multiplyScalar(forwardAmount).add(right.multiplyScalar(rightAmount));
    move.projectOnPlane(normal);
    move.setLength(1);

    character.move(move, 1);

    if (input.keyDown('space')) {
      character.jump();
    }
  };

  return {
    type: 'playerControl',
    tick: tick,
    set character(value) {
      character = value;
    },
    set rigidBody(value) {
      rigidBody = value
    }
  }
};

module.exports.$inject = ['app', 'input', 'camera'];