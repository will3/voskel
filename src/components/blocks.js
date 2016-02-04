var ndarray = require('ndarray');
var mesher = require('b-mesher');

module.exports = function(object, textures) {
  "use strict";

  var palette = [null, 0xffffff];

  var chunkSize = 16;
  var chunks = {};
  var offset = new THREE.Vector3();
  var mesh = null;
  var obj = new THREE.Object3D();
  object.add(obj);

  function updateMesh() {
    for (var id in chunks) {
      var chunk = chunks[id];
      if (chunk.dirty) {
        updateChunk(chunk);
        chunk.dirty = false;
      }
    }
  };

  function updateChunk(chunk) {
    if (chunk.mesh != null) {
      obj.remove(chunk.mesh);
    }

    var result = mesher(chunk.map);

    var geometry = new THREE.Geometry();

    var material = new THREE.MeshFaceMaterial();
    material.materials.push(
      new THREE.MeshBasicMaterial({
        map: textures['default']
      }),
      new THREE.MeshBasicMaterial({
        map: textures['grass']
      })
    );

    result.vertices.forEach(function(v) {
      var vertice = new THREE.Vector3(
        v[0], v[1], v[2]
      );
      geometry.vertices.push(vertice);
    });

    result.surfaces.forEach(function(surface) {
      var f = surface.face;
      var uv = surface.uv;
      var t = f[4];

      var face = new THREE.Face3(f[0], f[1], f[2]);
      geometry.faces.push(face);
      face.materialIndex = t - 1;
      geometry.faceVertexUvs[0].push([
        new THREE.Vector2().fromArray(uv[0]),
        new THREE.Vector2().fromArray(uv[1]),
        new THREE.Vector2().fromArray(uv[2])
      ]);


      face = new THREE.Face3(f[2], f[3], f[0]);
      geometry.faces.push(face);
      face.materialIndex = t - 1;
      geometry.faceVertexUvs[0].push([
        new THREE.Vector2().fromArray(uv[2]),
        new THREE.Vector2().fromArray(uv[3]),
        new THREE.Vector2().fromArray(uv[0])
      ]);
    });

    geometry.computeFaceNormals();

    mesh = new THREE.Mesh(geometry, material);
    var origin = chunk.origin;
    mesh.position.copy(new THREE.Vector3().addVectors(origin, offset));
    obj.add(mesh);
    chunk.mesh = mesh;
  };

  function set(x, y, z, obj) {
    var origin = getOrigin(x, y, z);
    var id = origin.join(',');
    var chunk = chunks[id];
    if (chunk == null) {
      chunk = chunks[id] = {
        origin: new THREE.Vector3(origin[0], origin[1], origin[2]),
        map: ndarray([], [chunkSize, chunkSize, chunkSize])
      };
    }
    chunk.map.set(x - origin[0], y - origin[1], z - origin[2], obj);
    chunk.dirty = true;
  };

  function get(x, y, z) {
    var origin = getOrigin(x, y, z);
    var id = origin.join(',');
    var chunk = chunks[id];
    if (chunk == null) {
      return undefined;
    }
    return chunk.map.get(x - origin[0], y - origin[1], z - origin[2]);
  };

  function getOrigin(x, y, z) {
    return [
      Math.floor(x / chunkSize) * chunkSize,
      Math.floor(y / chunkSize) * chunkSize,
      Math.floor(z / chunkSize) * chunkSize
    ];
  };

  function getAtCoord(coord) {
    return get(coord.x, coord.y, coord.z);
  };

  function pointToCoord(point, round) {
    round = round === undefined ? true : false;

    if (round) {
      return new THREE.Vector3(
        Math.round(point.x - offset.x - 0.5),
        Math.round(point.y - offset.y - 0.5),
        Math.round(point.z - offset.z - 0.5)
      );
    }

    return new THREE.Vector3(
      point.x - offset.x - 0.5,
      point.y - offset.y - 0.5,
      point.z - offset.z - 0.5
    );
  };

  function coordToPoint(coord) {
    return new THREE.Vector3(
      coord.x + offset.x, coord.y + offset.y, coord.z + offset.z
    );
  };

  updateMesh();

  return {
    updateMesh: updateMesh,
    palette: palette,
    offset: offset,
    get: get,
    set: set,
    pointToCoord: pointToCoord,
    coordToPoint: coordToPoint,
    getAtCoord: getAtCoord
  };
};

module.exports.$inject = ['textures'];