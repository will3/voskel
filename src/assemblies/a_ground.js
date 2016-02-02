var ndarray = require('ndarray');
var THREE = require('three');

module.exports = function(app, params) {
  "use strict";
  
  params = params || {};
  var hasEditor = params.hasEditor || false;
  var camera = params.camera;

  var object = new THREE.Object3D();
  var blocks = app.attach(object, require('../components/blocks'));

  var dim = [16, 16, 16];

  for (var i = 0; i < dim[0]; i++) {
    for (var j = 0; j < dim[1]; j++) {
      for (var k = 0; k < dim[2]; k++) {
        blocks.set(i, j, k, 1);
      }
    }
  }

  blocks.offset.set(-8, -8, -8);
  blocks.updateMesh();

  if (hasEditor) {
    var editor = app.attach(object, require('../components/editor'));
    editor.blocks = blocks;
    editor.camera = camera;
  }

  return {
    object: object,
    blocks: blocks
  };
};