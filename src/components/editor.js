var THREE = require('three');

module.exports = function(object, app, input, camera, devConsole, config) {
  "use strict";

  var raycaster = new THREE.Raycaster();
  var sn = 0.0001;
  var blocks = null;
  var ground = null;
  var boundingBox = null;
  var tempBlocks = null;

  devConsole.commands['new'] = function(args) {
    var size = args._[0] || 16;

    updateSize(size);
  };

  function updateSize(size) {
    blocks.setDim([size, size, size]);
    blocks.obj.position.set(-size / 2, -size / 2, -size / 2);
    tempBlocks.setDim([size, size, size]);
    tempBlocks.obj.position.set(-size / 2, -size / 2, -size / 2);
    updateGround(size);
    updateBoundingBox(size);
  };

  function updateGround(size) {
    if (ground != null) {
      object.remove(ground);
    }

    var geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(-size / 2, -size / 2, -size / 2),
      new THREE.Vector3(size / 2, -size / 2, -size / 2),
      new THREE.Vector3(size / 2, -size / 2, size / 2),
      new THREE.Vector3(-size / 2, -size / 2, size / 2)
    );
    geometry.faces.push(
      new THREE.Face3(2, 1, 0),
      new THREE.Face3(0, 3, 2)
    );
    geometry.faceVertexUvs[0].push(
      [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(size / 2, 0),
        new THREE.Vector2(size / 2, size / 2)
      ], [
        new THREE.Vector2(size / 2, size / 2),
        new THREE.Vector2(0, size / 2),
        new THREE.Vector2(0, 0)
      ]
    );
    var material = materials['placeholder'];
    ground = new THREE.Mesh(geometry, material);
    object.add(ground);
  };

  function updateBoundingBox(size) {
    if (boundingBox != null) {
      object.remove(boundingBox);
    }

    var geometry = new THREE.BoxGeometry(size, size, size);
    var material = new THREE.MeshBasicMaterial();
    boundingBox = new THREE.Mesh(geometry, material);
    var wireframe = new THREE.EdgesHelper(boundingBox, 0xffffff);
    object.add(wireframe);
  };

  function getCoord(atPoint, delta) {
    var viewport = input.screenToViewport(atPoint);
    raycaster.setFromCamera(viewport, camera);
    var objects = [];
    if (blocks.object != null) objects.push(blocks.obj);
    if (ground != null) objects.push(ground);
    var intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length === 0) {
      return undefined;
    }

    var intersect = intersects[0];

    var point = intersect.point;
    var diff = point.clone().sub(camera.position);
    diff = diff.setLength(diff.length() + delta || 0);
    point = camera.position.clone().add(diff);

    var localPoint = blocks.obj.worldToLocal(point);
    var coord = blocks.pointToCoord(localPoint);
    coord = new THREE.Vector3(
      Math.round(coord.x),
      Math.round(coord.y),
      Math.round(coord.z)
    );

    return coord;
  };

  function start() {
    blocks = app.attach(object, require('./blocks'));
    tempBlocks = app.attach(object, require('./blocks'));

    updateSize(config['editor_default_size']);
  };

  var _started = false;

  var lastMouse = new THREE.Vector2();

  var mouseSampleInterval = 4;

  function getMousePoints(from, to, maxDis) {
    var distance = new THREE.Vector2().subVectors(to, from).length();

    var interval = Math.ceil(distance / maxDis);
    var step = new THREE.Vector2().subVectors(to, from).setLength(distance / interval);

    var list = [];
    var start = from.clone();
    list.push(start);
    for (var i = 0; i < interval; i++) {
      start.add(step);
      list.push(start.clone());
    }
    return list;
  };

  function tick() {
    if (!_started) {
      start();
      _started = true;
    }

    if (input.mouseClick(0)) {
      var coord = getCoord(input.mouse, -sn);
      if (!!coord) {
        if (tempBlocks.getAtCoord(coord) != 1) {
          tempBlocks.setAtCoord(coord, 1);
        }
      }
    }

    if (input.mouseHold(0)) {
      var points = getMousePoints(lastMouse, input.mouse, mouseSampleInterval);
      for (var i = 0; i < points.length; i++) {
        var coord = getCoord(points[i], -sn);
        if (!!coord) {
          if (tempBlocks.getAtCoord(coord) !== 1) {
            tempBlocks.setAtCoord(coord, 1);
          }
        }
      }
    }

    if (input.mouseUp(0)) {
      commitTempBlocks();
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

    if (input.keyDown('a')) {
      blocks.offset[1]--;
      blocks.setDirty();

      tempBlocks.offset[1]--;
      blocks.setDirty();
    }

    if (input.keyDown('z')) {
      blocks.offset[1]++;
      blocks.setDirty();

      tempBlocks.offset[1]++;
      blocks.setDirty();
    }

    lastMouse = input.mouse.clone();
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

  var editor = {
    tick: tick,
    set blocks(value) {
      blocks = value;
    }
  };

  return editor;
};

module.exports.$inject = ['app', 'input', 'camera', 'devConsole', 'config'];