var THREE = require('three');

module.exports = function(object, input) {
  "use strict";
  
  var raycaster = new THREE.Raycaster();

  function getMouseCoord(delta) {
    var blocks = editor.blocks;
    var camera = editor.camera;
    var mouse = input.mouse;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(blocks.object, true);

    if (intersects.length === 0) {
      return undefined;
    }

    var intersect = intersects[0];

    var point = intersect.point;
    var diff = point.clone().sub(camera.position);
    diff = diff.setLength(diff.length() + delta || 0);
    point = camera.position.clone().add(diff);

    var coord = blocks.pointToCoord(point);

    return coord;
  };

  function tick() {
    var blocks = editor.blocks;
    if (input.mouseHold(0) && input.mouseMove || input.mouseDown(0)) {
      var coord = getMouseCoord(0.01);

      if (!!coord) {
        blocks.set(coord.x, coord.y, coord.z, 0);
        blocks.updateMesh();
      }
    } else if (input.mouseClick(2)) {
      var coord = getMouseCoord(-0.01);

      if (!!coord) {
      	blocks.set(coord.x, coord.y, coord.z, 1);
      	blocks.updateMesh();
      }
    }
  };

  var editor = {
    tick: tick,
    blocks: null,
    camera: null
  };

  return editor;
};

module.exports.$inject = ['input'];