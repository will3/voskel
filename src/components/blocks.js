var ndarray = require('ndarray');
var mesher = require('../voxel/mesher');

module.exports = function(object, materials) {
  "use strict";

  var palette = [null, 0xffffff];

  var dim = [32, 32, 32];
  var chunk = ndarray([], dim);
  var dirty = false;
  var mesh = null;
  var obj = new THREE.Object3D();
  var material = new THREE.MeshLambertMaterial();
  material.materials = materials;
  var offset = [0, 0, 0];

  object.add(obj);

  function updateResult(result) {
    if (mesh != null) {
      obj.remove(mesh);
    }

    var geometry = new THREE.Geometry();

    result.vertices.forEach(function(v) {
      var vertice = new THREE.Vector3(
        v[0], v[1], v[2]
      );
      geometry.vertices.push(vertice);
    });

    result.surfaces.forEach(function(surface) {
      var f = surface.face;
      var uv = surface.uv;
      var c = f[4];

      var face = new THREE.Face3(f[0], f[1], f[2]);
      geometry.faces.push(face);
      face.color = new THREE.Color(palette[c]);

      face = new THREE.Face3(f[2], f[3], f[0]);
      geometry.faces.push(face);
      face.color = new THREE.Color(palette[c]);
    });

    geometry.computeFaceNormals();

    mesh = new THREE.Mesh(geometry, material);
    obj.add(mesh);
  };

  function updateMesh() {
    var result = mesher(chunk.data, chunk.shape);
    updateResult(result);
  };

  function set(x, y, z, obj) {
    chunk.set(x, y, z, obj);
    dirty = true;
  };

  function get(x, y, z) {
    return chunk.get(x, y, z);
  };

  function getAtCoord(coord) {
    return get(coord.x, coord.y, coord.z);
  };

  function pointToCoord(point) {
    return new THREE.Vector3(point.x - 0.5, point.y - 0.5, point.z - 0.5);
  };

  function coordToPoint(coord) {
    return new THREE.Vector3(coord.x, coord.y, coord.z);
  };

  function setAtCoord(coord, b) {
    set(coord.x, coord.y, coord.z, b);
  };

  function tick() {
    if (dirty) {
      updateMesh();
      dirty = false;
    }
  };

  function clear() {
    chunk = ndarray([], dim);
    obj.remove(mesh);
  };

  function setDim(value) {
    dim = value;
    var newChunk = ndarray([], dim);
    var shape = chunk.shape;

    for (var i = 0; i < shape[0]; i++) {
      for (var j = 0; j < shape[1]; j++) {
        for (var k = 0; k < shape[2]; k++) {
          var b = chunk.get(i, j, k);
          if (!!b) {
            newChunk.set(i, j, k, b);
          }
        }
      }
    }

    dirty = true;
  };

  function visit(callback) {
    var shape = chunk.shape;
    var data = chunk.data;
    for (var i = 0; i < shape[0]; i++) {
      for (var j = 0; j < shape[1]; j++) {
        for (var k = 0; k < shape[2]; k++) {
          var b = chunk.get(i, j, k);
          if (!!b) {
            callback(i, j, k, b);
          }
        }
      }
    }
  };

  var blocks = {
    type: 'blocks',
    tick: tick,
    palette: palette,
    get: get,
    set: set,
    pointToCoord: pointToCoord,
    coordToPoint: coordToPoint,
    getAtCoord: getAtCoord,
    setAtCoord: setAtCoord,
    get material() {
      return material;
    },
    clear: clear,
    get obj() {
      return obj;
    },
    visit: visit,
    setDim: setDim,
    get chunk() {
      return chunk;
    },
    offset: offset,
    setDirty: function(value) {
      dirty = true;
    }
  };

  return blocks;
};

module.exports.$inject = ['materials'];