module.exports = function(camera, app) {
  var cameraTilt = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ'));

  var lastGravityDir = null;
  var cameraQuat = new THREE.Quaternion();
  var cameraQuatFinal = new THREE.Quaternion();
  var trackball = null;

  var distance = 100;
  var target = new THREE.Vector3();
  var quaternion = new THREE.Quaternion();

  function tick() {
    var player = app.get('player');
    if (player == null) {
      return;
    }

    var rigidBody = app.getComponent(player, 'rigidBody');

    var gravityDir;
    if(rigidBody.grounded) {
      gravityDir = rigidBody.gravity.dir.clone();
    }else {
      gravityDir = rigidBody.gravity.forceDir.clone();
    }

    if(gravityDir.length() == 0) {
      return;
    }

    var a = gravityDir.clone().multiplyScalar(-1);

    var diff = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0).applyQuaternion(cameraQuat),
      a
    );

    cameraQuat.multiplyQuaternions(diff, cameraQuat);
    cameraQuatFinal = new THREE.Quaternion().multiplyQuaternions(
      cameraQuat,
      cameraTilt);

    quaternion.slerp(cameraQuatFinal, 0.1);

    lastGravity = gravityDir;

    updateCamera();
  };

  function updateCamera() {
    var diff = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(quaternion)
      .setLength(distance);
    var pos = target.clone()
      .add(diff);
    camera.position.copy(pos);

    var up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
    camera.up.copy(up);
    camera.lookAt(target);
  };

  return {
    tick: tick
  };
};

module.exports.$inject = ['app'];