module.exports = function(camera) {
  var distance = 100;
  var target = new THREE.Vector3();
  var quaternion = new THREE.Quaternion();

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

  function tick() {
    updateCamera();
  };

  return {
    type: 'trackball',
    tick: tick,
    get quaternion() {
      return quaternion;
    },
    updateCamera: updateCamera
  };
};