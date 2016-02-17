var ndarray = require('ndarray');
var mesher = require('../voxel/mesher');

var Blocks = function(object) {
  this.object = object;
  this.type = 'blocks';
  this.dim = [32, 32, 32];
  this.chunk = ndarray([], this.dim);
  this.dirty = false;
  this.mesh = null;
  this.obj = new THREE.Object3D();
  this.material = new THREE.MultiMaterial();
  this.offset = new THREE.Vector3();

  this.object.add(this.obj);
};

Blocks.prototype._updateMesh = function(result) {
  if (this.mesh != null) {
    this.obj.remove(this.mesh);
  }
  // this.chunk.data
  var self = this;
  var offset = this.offset;
  var dim = this.dim;

  var result = mesher(function(i, j, k) {
    return self.get(
      (i + offset.x) % dim[0],
      (j + offset.y) % dim[1],
      (k + offset.z) % dim[2]);
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

Blocks.prototype.set = function(x, y, z, b) {
  this.chunk.set(x, y, z, b);
  this.dirty = true;
};

Blocks.prototype.setAtCoord = function(coord, b) {
  this.set(coord.x, coord.y, coord.z, b);
};

Blocks.prototype.getCoordWithOffset = function(coord) {
  var coordWithOffset = coord.clone().add(this.offset).add(new THREE.Vector3().fromArray(this.dim));
  coordWithOffset.x %= this.dim[0];
  coordWithOffset.y %= this.dim[1];
  coordWithOffset.z %= this.dim[2];
  return coordWithOffset;
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
  if (this.dirty) {
    this._updateMesh();
    this.dirty = false;
  }
};

Blocks.prototype.clear = function() {
  this.chunk = ndarray([], this.dim);
  this.obj.remove(this.mesh);
};

Blocks.prototype.setDim = function(value) {
  this.dim = value;
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

  this.dirty = true;
};

Blocks.prototype.addToOffset = function(value) {
  this.offset.add(value);
  this.offset.x = (this.offset.x + this.dim[0]) % this.dim[0];
  this.offset.y = (this.offset.y + this.dim[1]) % this.dim[1];
  this.offset.z = (this.offset.z + this.dim[2]) % this.dim[2];
  this.dirty = true;
};

Blocks.prototype.setOffset = function(value) {
  this.offset.copy(value);
  this.dirty = true;
}

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

Blocks.prototype.print = function() {
  this.visit(function(i, j, k, b) {
    console.log([i, j, k].join(','), b);
  });
};

Blocks.prototype.serialize = function() {
  return {
    dim: this.dim,
    chunkData: this.chunk.data,
    offset: this.offset.toArray()
  };
};

Blocks.prototype.deserialize = function(json) {
  this.dim = json.dim;
  this.chunk = ndarray([], this.dim);
  for (var i = 0; i < json.chunkData.length; i++) {
    this.chunk.data[i] = json.chunkData[i];
  }
  this.offset.fromArray(json.offset);
};

module.exports = Blocks;