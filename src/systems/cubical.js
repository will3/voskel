var THREE = require('three');

var Gravity = function(dir, axis, positive) {
  this.dir = dir || new THREE.Vector3();
  this.axis = axis || '';
  this.positive = positive || '';

  this.clone = function() {
    return new Gravity(this.dir, this.axis, this.positive);
  };

  this.equals = function(gravity) {
    return this.dir.equals(gravity.dir);
  };

  this.isNone = function() {
    return this.dir.length() === 0;
  };
};

var gravities = {
  none: new Gravity(),
  right: new Gravity(new THREE.Vector3(1, 0, 0).normalize(), 'x', true),
  left: new Gravity(new THREE.Vector3(-1, 0, 0).normalize(), 'x', false),
  top: new Gravity(new THREE.Vector3(0, 1, 0).normalize(), 'y', true),
  bottom: new Gravity(new THREE.Vector3(0, -1, 0).normalize(), 'y', false),
  front: new Gravity(new THREE.Vector3(0, 0, 1).normalize(), 'z', true),
  back: new Gravity(new THREE.Vector3(0, 0, -1).normalize(), 'z', false)
};

module.exports = function() {
  "use strict";

  var map = {};
  var cog = new THREE.Vector3();
  var gravityAmount = 0.05;

  function onAttach(object, component) {
    if (component.type === 'rigidBody') {
      map[component._id] = component;
      component.gravity = gravities.none;
    }
  };

  function onDettach(object, component) {
    if (component.type === 'rigidBody') delete map[component._id];
  };

  function tick() {
    for (var id in map) {
      var component = map[id];
      updateComponent(component);
    }
  };

  function getGravity(position) {
    var min = 1;
    var closest = null;
    for (var id in gravities) {
      var gravity = gravities[id];
      var dot = gravity.dir.clone().dot(position.clone().normalize());
      if (dot < min) {
        min = dot;
        closest = gravity;
      }
    }

    return closest.clone();
  };

  function updateComponent(rigidBody) {
    var ground = physics.ground;
    
    // Apply gravity
    var gravity = getGravity(rigidBody.object.position);
    rigidBody.gravity = gravity;
    
    var gravityForce = gravity.dir.clone().setLength(gravityAmount);
    rigidBody.applyForce(gravityForce);

    // Apply acceleration to velocity
    rigidBody.velocity.add(rigidBody.acceleration);
    rigidBody.velocity.multiplyScalar(rigidBody.friction);

    rigidBody.grounded = false;
    // Find collisions and generate contact forces
    if (ground != null) {
      var velocities = {
        'x': new THREE.Vector3(rigidBody.velocity.x, 0, 0),
        'y': new THREE.Vector3(0, rigidBody.velocity.y, 0),
        'z': new THREE.Vector3(0, 0, rigidBody.velocity.z)
      }

      var position = rigidBody.object.position.clone();
      for (var axis in velocities) {
        var v = velocities[axis];
        var raycaster = new THREE.Raycaster(
          position,
          v.clone().normalize(),
          0,
          v.length() + 0.5
        );

        var intersects = raycaster.intersectObject(ground.object, true);
        if (intersects.length > 0) {
          var intersect = intersects[0];
          var mag = intersect.distance - 0.5;
          rigidBody.velocity[axis] = rigidBody.velocity[axis] > 0 ? mag : -mag;
          if (axis === gravity.axis) {
            rigidBody.grounded = true;
          }
        }

        position.add(v);
      }
    }

    // Apply velocity
    rigidBody.object.position.add(rigidBody.velocity);

    // Clear acceleration
    rigidBody.acceleration.set(0, 0, 0);
  };

  var physics = {
    onAttach: onAttach,
    onDettach: onDettach,
    tick: tick,
    ground: null
  };

  return physics;
};