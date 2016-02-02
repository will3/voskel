var gravityUtils = require('../utils/gravityutils');

module.exports = function(object, app, input, camera) {
  "use strict";

  var character = null;

  var lastGravity = null;

  var rigidBody = null;

  var trackball = null;

  var cameraTilt = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ'));

  var lastGravity = null;
  var cameraQuat = new THREE.Quaternion();
  var cameraQuatFinal = new THREE.Quaternion();

  function tick() {
    trackball = trackball || app.getComponent(camera, 'trackball');

    var gravity = rigidBody.gravity;

    if (lastGravity == null || !gravity.equals(lastGravity)) {
      var a = gravity.dir.clone().multiplyScalar(-1);

      var diff = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0).applyQuaternion(cameraQuat),
        a
      );

      cameraQuat.multiplyQuaternions(diff, cameraQuat);
      cameraQuatFinal = new THREE.Quaternion().multiplyQuaternions(
        cameraQuat,
        cameraTilt);
    }

    trackball.quaternion.slerp(cameraQuatFinal, 0.1);

    lastGravity = gravity;

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