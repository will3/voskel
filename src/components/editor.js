var THREE = require('three');

module.exports = function(object, app, input, camera, devConsole, config) {
  "use strict";

  var raycaster = new THREE.Raycaster();
  var sn = 0.0001;
  var blocks = null;
  var ground = null;
  var tempBlocks = null;

  devConsole.commands['new'] = function(args) {
    var size = args._[0] || 16;

    updateGround(size);
  };

  function updateGround(size) {
    ground.clear();

    var dim = [size, 2, size];

    for (var i = 0; i < dim[0]; i++) {
      for (var j = 0; j < dim[1]; j++) {
        for (var k = 0; k < dim[2]; k++) {
          ground.set(i, j, k, 1);
        }
      }
    }

    ground.offset.set(-dim[0] / 2, -dim[1] / 2, -dim[2] / 2);
    ground.updateMesh();
  };

  function getMouseCoord(delta) {
    var mouse = input.mouse;
    raycaster.setFromCamera(mouse, camera);
    var objects = [];
    if (blocks.object != null) objects.push(blocks.obj);
    if (ground.object != null) objects.push(ground.obj);
    var intersects = raycaster.intersectObjects(objects, true);

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

  var startCoord = null;
  var endCoord = null;

  function start() {
    ground = app.attach(object, require('./blocks'));
    updateGround(config['editor_ground_size']);
    blocks = app.attach(object, require('./blocks'));
    tempBlocks = app.attach(object, require('./blocks'));
  };

  var _started = false;

  function tick() {
    if (!_started) {
      start();
      _started = true;
    }

    var mouse = input.mouse.clone();
    var coordA = getMouseCoord(-sn);
    var coordB = getMouseCoord(sn);

    if (input.mouseClick(0)) {
      blocks.setAtCoord(coordA, 1);
    }

    if (input.mouseDown(0)) {
      if (!!startCoord) {
        commitTempBlocks();
        startCoord = null;
      }
    }

    if (input.mouseHold(0)) {
      if(startCoord == null && !!coordA) {
        startCoord = coordA.clone();
      }

      endCoord = coordA;

      if (!!startCoord && !!endCoord) {
        updateTempBlocks();
      }
    }

    if (input.keyDown('up')) {
      if (!!startCoord && !!endCoord) {
        endCoord.y++;
        if (startCoord.y == endCoord.y) {
          endCoord.y++;
        }
        updateTempBlocks();
      }
    }

    if (input.keyDown('down')) {
      if (!!startCoord && !!endCoord) {
        endCoord.y--;
        if (startCoord.y == endCoord.y) {
          endCoord.y--;
        }
        updateTempBlocks();
      }
    }

  };

  function updateTempBlocks() {
    tempBlocks.clear();
    visitBound(startCoord, endCoord, function(i, j, k) {
      tempBlocks.set(i, j, k, 1);
    });
  };

  function commitTempBlocks() {
    tempBlocks.visit(function(i, j, k, b) {
      blocks.set(i, j, k, b);
    });
    tempBlocks.clear();
  };

  function visitBound(lo, hi, callback) {
    var xs = hi.x > lo.x ? [lo.x, hi.x] : [hi.x, lo.x];
    var ys = hi.y > lo.y ? [lo.y, hi.y] : [hi.y, lo.y];
    var zs = hi.z > lo.z ? [lo.z, hi.z] : [hi.z, lo.z];
    for (var i = xs[0]; i <= xs[1]; i++) {
      for (var j = ys[0]; j <= ys[1]; j++) {
        for (var k = zs[0]; k <= zs[1]; k++) {
          callback(i, j, k);
        }
      }
    }
  };

  var editor = {
    tick: tick,
    set blocks(value) {
      blocks = value;
    }
  };

  return editor;
};

module.exports.$inject = ['app', 'input', 'camera', 'devConsole', 'config'];