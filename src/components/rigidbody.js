var THREE = require('three');

module.exports = function(object) {
  "use strict";

  var velocity = new THREE.Vector3();
  var acceleration = new THREE.Vector3();

  function applyForce(force) {
    acceleration.add(force.clone().multiplyScalar(1 / rigidBody.mass));
  };

  var rigidBody = {
    type: 'rigidBody',
    velocity: velocity,
    acceleration: acceleration,
    applyForce: applyForce,
    friction: 0.98,
    mass: 1,
    gravity: null
  };

  return rigidBody;
};