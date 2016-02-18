var PlayerCamera = function(camera, app) {
  this.camera = camera;
  this.app = app;

  this.cameraTilt = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ'));

  this.cameraQuat = new THREE.Quaternion();
  this.cameraQuatFinal = new THREE.Quaternion();

  this.distance = 100;
  this.target = new THREE.Vector3();
  this.quaternion = new THREE.Quaternion();
};

PlayerCamera.$inject = ['app'];

PlayerCamera.prototype.tick = function() {
  var player = app.get('player');
  if (player == null) {
    return;
  }

  var rigidBody = app.getComponent(player, 'rigidBody');

  var gravityDir;
  if (rigidBody.grounded) {
    gravityDir = rigidBody.gravity.dir.clone();
  } else {
    gravityDir = rigidBody.gravity.forceDir.clone();
  }

  if (gravityDir.length() == 0) {
    return;
  }

  var a = gravityDir.clone().multiplyScalar(-1);

  var diff = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0).applyQuaternion(this.cameraQuat),
    a
  );

  this.cameraQuat.multiplyQuaternions(diff, this.cameraQuat);
  this.cameraQuatFinal = new THREE.Quaternion().multiplyQuaternions(
    this.cameraQuat,
    this.cameraTilt);

  this.quaternion.slerp(this.cameraQuatFinal, 0.1);

  lastGravity = gravityDir;

  this.updateCamera();
};

PlayerCamera.prototype.updateCamera = function() {
  var diff = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(this.quaternion)
    .setLength(this.distance);
  var pos = this.target.clone()
    .add(diff);
  camera.position.copy(pos);

  var up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
  camera.up.copy(up);
  camera.lookAt(this.target);
};

module.exports = PlayerCamera;