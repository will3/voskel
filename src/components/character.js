var THREE = require('three');
var gravityUtils = require('../utils/gravityutils');

module.exports = function(object, physics) {
  "use strict";

  var geometry = new THREE.BoxGeometry(1, 1, 1);
  var material = new THREE.MeshBasicMaterial({
    color: 0xff0000
  });
  var moveSpeed = 0.3;
  var jumpSpeed = 0.8;

  var mesh = new THREE.Mesh(geometry, material);
  object.add(mesh);
  var jumping = false;

  function tick() {
    if (jumping && this.rigidBody.grounded) {
      jumping = false;
    }
  };

  function move(forward, amount) {
    if (this.rigidBody.grounded || jumping) {
      var gravityDir = gravityUtils.getGravity(object.position).dir;
      var verticalSpeed = this.rigidBody.velocity.clone().projectOnVector(gravityDir);
      var forwardSpeed = forward.clone().setLength(amount * moveSpeed);
      this.rigidBody.velocity.copy(verticalSpeed.add(forwardSpeed));
    }
  };

  function jump(amount) {
    if (this.rigidBody.grounded) {
      jumping = true;
      var gravityDir = gravityUtils.getGravity(object.position).dir;
      this.rigidBody.velocity.copy(gravityDir.clone().multiplyScalar(-jumpSpeed));
    }
  };

  var character = {
    tick: tick,
    move: move,
    jump: jump,
    rigidBody: null
  };

  return character;
};

module.exports.$inject = ['physics'];