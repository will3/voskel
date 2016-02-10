var THREE = require('three');

var APlayer = function() {
  this.object = null;
  this.app = null;
};

APlayer.prototype.spwan = function(params) {
  var app = this.app;
  
  var scene = app.get('scene');

  var object = new THREE.Object3D();
  var character = app.attach(object, require('../components/character'));
  var rigidBody = app.attach(object, require('../components/rigidbody'));
  var playerControl = app.attach(object, require('../components/playercontrol'));

  character.rigidBody = rigidBody;
  playerControl.character = character;
  playerControl.rigidBody = rigidBody;

  scene.add(object);

  this.object = object;
};

APlayer.prototype.replicate = function(payload) {
  this.object.position.fromArray(payload.position);
};

APlayer.prototype.serialize = function() {
  return {
    position: this.object.position.toArray()
  }
};

module.exports = APlayer;