var SetCommand = function(blocks, coords, value) {
  this.blocks = blocks;
  this.coords = coords;
  this.value = value;

  this.original = {};
};

SetCommand.prototype.run = function() {
  for (var i = 0; i < this.coords.length; i++) {
    var coord = this.coords[i];
    var b = this.blocks.getAtCoord(coord);
    var hash = coord.toArray().join(',');
    this.original[hash] = b;

    this.blocks.setAtCoord(coord, this.value);
  }
};

SetCommand.prototype.undo = function() {
  for (var id in this.original) {
    var items = id.split(',');
    var coord = new THREE.Vector3(parseInt(items[0]), parseInt(items[1]), parseInt(items[2]));
    this.blocks.setAtCoord(coord, this.original[id]);
  }
};

module.exports = SetCommand;