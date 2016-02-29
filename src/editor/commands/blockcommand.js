var BlockCommand = function(blocks) {
  this.blocks = blocks;

  this.subCommands = [];

  this.deltas = [];
};

BlockCommand.prototype.set = function(coord, value) {
  this.subCommands.push({
    coord: coord,
    value: value
  });
};

BlockCommand.prototype.setAtCoords = function(coords, value) {
  this.subCommands.push({
    coords: coords,
    value: value
  });
};

BlockCommand.prototype.run = function() {
  for (var i = 0; i < this.subCommands.length; i++) {
    var subCommand = this.subCommands[i];
    var value = subCommand.value;
    var coords = subCommand.coords || [subCommand.coord];

    for (var j = 0; j < coords.length; j++) {
      var coord = coords[j];
      var previousValue = this.blocks.getAtCoord(coord);
      this.deltas.push({
        coord: coord,
        previousValue: previousValue
      });

      this.blocks.setAtCoord(coord, value);
    }
  }
};

BlockCommand.prototype.undo = function() {
  for (var i = this.deltas.length - 1; i >= 0; i--) {
    var delta = this.deltas[i];
    this.blocks.setAtCoord(delta.coord, delta.previousValue);
  }
};

module.exports = BlockCommand;