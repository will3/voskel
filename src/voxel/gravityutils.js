var gravities = {
  none: new Gravity(),
  right: new Gravity(new THREE.Vector3(1, 0, 0).normalize(), 'x', true),
  left: new Gravity(new THREE.Vector3(-1, 0, 0).normalize(), 'x', false),
  top: new Gravity(new THREE.Vector3(0, 1, 0).normalize(), 'y', true),
  bottom: new Gravity(new THREE.Vector3(0, -1, 0).normalize(), 'y', false),
  front: new Gravity(new THREE.Vector3(0, 0, 1).normalize(), 'z', true),
  back: new Gravity(new THREE.Vector3(0, 0, -1).normalize(), 'z', false)
};

module.exports = {
  getGravity: function(position) {
    var min = 1;
    var closest = null;
    var force = new THREE.Vector3();
    for (var id in gravities) {
      var gravity = gravities[id];
      var dot = gravity.dir.clone().dot(position.clone().normalize());
      if (dot < min) {
        min = dot;
        closest = gravity;
      }

      if(dot < - 0.5) {
        var ratio = -0.5 - dot;
        force.add(gravity.dir.clone().multiplyScalar(ratio));
      }
    }

    var gravity = closest.clone();
    gravity.forceDir = force.normalize();
    return gravity;
  }
};