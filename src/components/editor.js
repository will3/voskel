var THREE = require('three');

module.exports = function(object, input, camera) {
  "use strict";

  var raycaster = new THREE.Raycaster();
  var sn = 0.0001;
  var blocks = null;

  function getMouseCoord(delta) {
    var mouse = input.mouse;

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

  function tick() {
    var shouldAdd = (input.mouseHold(0) && input.mouseMove) || input.mouseClick(0);
    var shouldRemove = (input.mouseHold(2) && input.mouseMove) || input.mouseClick(2);

    if (shouldAdd) {
      var coord = getMouseCoord(-sn);

      if (!!coord) {
        blocks.set(coord.x, coord.y, coord.z, 1);
        blocks.updateMesh();
      }
    } else if (shouldRemove) {
      var coord = getMouseCoord(sn);

      if (!!coord) {
        blocks.set(coord.x, coord.y, coord.z, 0);
        blocks.updateMesh();
      }
    }

    // drawWireframe();
  };

  function getVector(i, j, k, d, u, v) {
    var array = [];
    array[d] = i;
    array[u] = j;
    array[v] = k;
    return new THREE.Vector3().fromArray(array);
  }

  var wireframe = null;
  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x000000
  });

  function drawWireframe() {
    if (!!wireframe) {
      object.remove(wireframe);
      wireframe.geometry.dispose();
    }
    var coordA = getMouseCoord(-sn);
    var coordB = getMouseCoord(sn);

    if (!coordA || !coordB) return;

    coordA = coordA.toArray();
    coordB = coordB.toArray();

    var coords = [];

    for (var d = 0; d < 3; d++) {
      var u = (d + 1) % 3;
      var v = (d + 2) % 3;

      if (coordA[d] !== coordB[d]) {
        var sign = coordA[d] > coordB[d] ? 1 : -1;
        var i = (coordA[d] + coordB[d]) / 2  +0.5 + sign * 0.1;
        var j0 = coordA[u];
        var j1 = coordA[u] + 1.0;
        var k0 = coordA[v];
        var k1 = coordA[v] + 1.0;

        coords.push(
          getVector(i, j0, k0, d, u, v),
          getVector(i, j1, k0, d, u, v),
          getVector(i, j1, k1, d, u, v),
          getVector(i, j0, k1, d, u, v),
          getVector(i, j0, k0, d, u, v)
        );

        break;
      }
    }

    var geometry = new THREE.Geometry();
    for (var i = 0; i < coords.length; i++) {
      var point = blocks.coordToPoint(coords[i]);
      geometry.vertices.push(point);
    }
    wireframe = new THREE.Line(geometry, lineMaterial);
    object.add(wireframe);
  };

  var editor = {
    tick: tick,
    set blocks(value) {
      blocks = value;
    }
  };

  return editor;
};

module.exports.$inject = ['input', 'camera'];