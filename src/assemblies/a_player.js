var THREE = require('three');

module.exports = function(app) {
  "use strict";

  var object = new THREE.Object3D();
  var character = app.attach(object, require('../components/character'));
  var rigidBody = app.attach(object, require('../components/rigidbody'));
  var playerControl = app.attach(object, require('../components/playercontrol'));

  character.rigidBody = rigidBody;
  playerControl.character = character;
  playerControl.rigidBody = rigidBody;

  return {
    object: object
  };
};