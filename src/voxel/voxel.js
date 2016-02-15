var THREE = require('three');
var gravityUtils = require('./gravityutils');

module.exports = function() {
  "use strict";

  var map = {};
  var cog = new THREE.Vector3();
  var gravityAmount = 0.05;

  function onAttach(object, component) {
    var voxelBody = this.app.getComponent(object, 'voxelBody');
    var rigidBody = this.app.getComponent(object, 'rigidBody');
    if(voxelBody != null && rigidBody != null) {
      map[object._id] = {
        voxelBody: voxelBody,
        rigidBody: rigidBody
      }
    }
  };

  function onDettach(object, component) {
    if(map[object._id] != null) {
      delete [object._id];
    }
  };

  function tick() {
    for (var id in map) {
      var node = map[id];
      updateNode(component);
    }
  };

  function updateNode(node) {
    var ground = physics.ground;
    var node = node.rigidBody;

    // Apply gravity
    var gravity = gravityUtils.getGravity(rigidBody.object.position);
    rigidBody.gravity = gravity;
    
    if(rigidBody.grounded) {
      var gravityForce = gravity.dir.clone().setLength(gravityAmount);
      rigidBody.applyForce(gravityForce);  
    }else {
      var gravityForce = gravity.forceDir.clone().setLength(gravityAmount);
      rigidBody.applyForce(gravityForce);
    }
    

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
    ground: null,
    app: null
  };

  return physics;
};