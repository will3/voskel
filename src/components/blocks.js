var ndarray = require('ndarray');
var mesher = require('../voxel/mesher');
var arrayUtils = require('../utils/arrayutils');

var Blocks = function(object) {
  this.object = object;
  this.type = 'blocks';

  this.dim = [16, 16, 16];
  this.chunk = ndarray([], this.dim);

  this.mesh = null;
  this.obj = new THREE.Object3D();
  this.material = new THREE.MultiMaterial();

  this.dirty = false;
  this.dimNeedsUpdate = false;

  this.object.add(this.obj);

  this.palette = [null];

  this.userData = {};
};

Blocks.prototype.set = function(x, y, z, b) {
  this.chunk.set(x, y, z, b);
  this.dirty = true;
};

Blocks.prototype.setAtCoord = function(coord, b) {
  this.set(coord.x, coord.y, coord.z, b);
};

Blocks.prototype.get = function(x, y, z) {
  return this.chunk.get(x, y, z);
};

Blocks.prototype.getAtCoord = function(coord) {
  return this.get(coord.x, coord.y, coord.z);
};

Blocks.prototype.pointToCoord = function(point) {
  return new THREE.Vector3(point.x - 0.5, point.y - 0.5, point.z - 0.5);
};

Blocks.prototype.coordToPoint = function(coord) {
  return new THREE.Vector3(coord.x, coord.y, coord.z);
};

Blocks.prototype.tick = function() {
  if (this.dimNeedsUpdate) {
    this._updateDim();
    this.dimNeedsUpdate = false;
  }

  this.updateMesh();
};

Blocks.prototype.clear = function() {
  this.chunk = ndarray([], this.dim);
  this.obj.remove(this.mesh);
};

Blocks.prototype.setDim = function(value) {
  this.dim = value;
  this.dimNeedsUpdate = true;
  this.dirty = true;
};

Blocks.prototype.visit = function(callback) {
  var shape = this.chunk.shape;
  var data = this.chunk.data;
  for (var i = 0; i < shape[0]; i++) {
    for (var j = 0; j < shape[1]; j++) {
      for (var k = 0; k < shape[2]; k++) {
        var b = this.chunk.get(i, j, k);
        if (!!b) {
          callback(i, j, k, b);
        }
      }
    }
  }
};

Blocks.prototype.getAllCoords = function() {
  var coords = [];
  this.visit(function(i, j, k) {
    coords.push(new THREE.Vector3(i, j, k));
  });
  return coords;
};

Blocks.prototype.print = function() {
  this.visit(function(i, j, k, b) {
    console.log([i, j, k].join(','), b);
  });
};

Blocks.prototype.serialize = function() {
  return {
    dim: this.dim,
    chunkData: arrayUtils.clone(this.chunk.data),
    palette: this.palette,
    userData: this.userData
  };
};

Blocks.prototype.deserialize = function(json) {
  this.dim = json.dim;
  this.chunk = ndarray([], this.dim);
  for (var i = 0; i < json.chunkData.length; i++) {
    this.chunk.data[i] = json.chunkData[i];
  }

  this.palette = json.palette;

  this.updateMaterial();

  this.dimNeedsUpdate = true;
  this.dirty = true;

  this.userData = json.userData;
};

Blocks.prototype.updateMesh = function() {
  if (this.dirty) {
    this._updateMesh();
    this.dirty = false;
  }
};

Blocks.prototype._updateMesh = function() {
  if (this.mesh != null) {
    this.obj.remove(this.mesh);
  }

  var self = this;
  var dim = this.dim;

  var result = mesher(function(i, j, k) {
    return self.get(i, j, k);
  }, dim);

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
    c = c.value || c;

    var face = new THREE.Face3(f[0], f[1], f[2]);
    geometry.faces.push(face);
    geometry.faceVertexUvs[0].push([uv[0], uv[1], uv[2]]);
    face.materialIndex = c - 1;

    face = new THREE.Face3(f[2], f[3], f[0]);
    geometry.faces.push(face);
    geometry.faceVertexUvs[0].push([uv[2], uv[3], uv[0]]);
    face.materialIndex = c - 1;
  });

  geometry.computeFaceNormals();

  this.mesh = new THREE.Mesh(geometry, this.material);
  this.obj.add(this.mesh);
};

Blocks.prototype._updateDim = function() {
  var newChunk = ndarray([], this.dim);
  var shape = this.chunk.shape;

  for (var i = 0; i < shape[0]; i++) {
    for (var j = 0; j < shape[1]; j++) {
      for (var k = 0; k < shape[2]; k++) {
        var b = this.chunk.get(i, j, k);
        if (!!b) {
          newChunk.set(i, j, k, b);
        }
      }
    }
  }

  this.chunk = newChunk;
};

Blocks.prototype.getOrAddColorIndex = function(color) {
  // null, 0, false, undefined
  if (!color) {
    return 0;
  }

  var index = arrayUtils.indexOf(this.palette, color);
  if (index == -1) {
    this.palette.push(color);
    index = this.palette.length - 1;
    var material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.palette[index])
    });
    this.material.materials.push(material);
    return this.palette.length - 1;
  } else {
    return index;
  }
};

Blocks.prototype.updateMaterial = function() {
  this.material = new THREE.MultiMaterial();
  for (var i = 1; i < this.palette.length; i++) {
    var material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.palette[i])
    });
    this.material.materials.push(material);
  }
};

module.exports = Blocks;