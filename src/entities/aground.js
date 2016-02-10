var ndarray = require('ndarray');
var THREE = require('three');

var Ground = function() {
  this.app = null;
  this.blocksComponent = null;
};

Ground.prototype.spawn = function(params) {
  var app = this.app;
  var scene = app.get('scene');

  params = params || {};
  var hasEditor = params.hasEditor || false;
  var camera = params.camera;

  var object = new THREE.Object3D();
  var blocks = app.attach(object, require('../components/blocks'));

  var dim = [32, 32, 32];

  for (var i = 0; i < dim[0]; i++) {
    for (var j = 0; j < dim[1]; j++) {
      for (var k = 0; k < dim[2]; k++) {
        blocks.set(i, j, k, 1);
      }
    }
  }

  blocks.offset.set(-16, -16, -16);
  blocks.updateMesh();

  if (hasEditor) {
    var editor = app.attach(object, require('../components/editor'));
    editor.blocks = blocks;
  }

  scene.add(object);

  this.blocksComponent = blocks;
};

Ground.prototype.replicate = function(payload) {

};

Ground.prototype.serialize = function() {

};

module.exports = Ground;
