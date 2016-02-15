var THREE = require('three');

module.exports = function(object, app, input, camera, devConsole) {
  "use strict";

  var raycaster = new THREE.Raycaster();
  var sn = 0.0001;
  var blocks = null;

  devConsole.commands['new'] = function(args) {
    var size = args._[0] || 16;
    var halfSize = size / 2;

    blocks.clear();

    var dim = [size, size, size];

    for (var i = 0; i < dim[0]; i++) {
      for (var j = 0; j < dim[1]; j++) {
        for (var k = 0; k < dim[2]; k++) {
          blocks.set(i, j, k, 1);
        }
      }
    }

    blocks.offset.set(-halfSize, -halfSize, -halfSize);
    blocks.updateMesh();

    var player = app.get('player');
    player.position.set(0, size + 20, 0);
  };

  function getMouseCoord(mouse, delta) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(blocks.collisionMeshes());

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

  var lastMouse = new THREE.Vector2();

  function addBlock(point) {
    var coord = getMouseCoord(point, -sn);

    if (!!coord) {
      blocks.set(coord.x, coord.y, coord.z, 1);
      blocks.updateMesh();
    }
  };

  function removeBlock(point) {
    var coord = getMouseCoord(point, sn);

    if (!!coord) {
      blocks.set(coord.x, coord.y, coord.z, 0);
      blocks.updateMesh();
    }
  };

  function tick() {
    var mouse = input.mouse.clone();

    if(input.mouseClick(0)) {
      addBlock(mouse);
    }

    if(input.mouseClick(2)) {
      removeBlock(mouse);
    }

    var dir = new THREE.Vector2().subVectors(mouse, lastMouse);
    var distance = dir.length();
    var gap = 1;
    var interval = distance / gap;
    
    var step = dir.clone().setLength(gap);

    if(input.mouseHold(0)) {
      var point = lastMouse.clone();
      for(var i = 0; i < interval; i ++) {
        addBlock(point);
        point.add(step);
      }

      lastMouse.copy(point);
    }

    if(input.mouseHold(2)) {

    }

    lastMouse = mouse;
  };

  var editor = {
    tick: tick,
    set blocks(value) {
      blocks = value;
    }
  };

  return editor;
};

module.exports.$inject = ['app', 'input', 'camera', 'devConsole'];