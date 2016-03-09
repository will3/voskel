var SetCommand = require('../commands/setcommand');

var FillTool = function(editor) {
  this.editor = editor;
  this.input = this.editor.input;
  this.blocksCopy = null;
  this.startCoord = null;
  this.endCoord = null;
};

FillTool.prototype.start = function() {
  this.editor.updateLastBlocks();
};

FillTool.prototype.tick = function() {
  var coordAbove = this.editor.getCoordAbove();
  var coordBelow = this.editor.getCoordBelow();
  var shouldUpdate = false;

  var isRemove = this.input.mouseHold(2) || this.input.mouseUp(2);

  this.editor.highlightCoord = this.editor.selectedColor == null ? coordBelow : coordAbove;

  var coord = (isRemove || this.editor.selectedColor == null) ? coordBelow : coordAbove;

  if (this.input.mouseDown() && coord != null) {
    this.blocksCopy = this.editor.blocks.serialize();
    if (this.startCoord == null) {
      this.startCoord = coord;
      this.endCoord = coord;
      shouldUpdate = true;
    }
  }

  if (this.startCoord != null && coord != null) {
    if (this.endCoord == null || !this.endCoord.equals(coord)) {
      this.endCoord = coord;
      shouldUpdate = true;
    }
  }

  var index = isRemove ? 0 :
    this.editor.blocks.getOrAddColorIndex(this.editor.selectedColor);

  if (this.startCoord != null && this.endCoord != null && shouldUpdate) {
    this.editor.blocks.deserialize(this.blocksCopy);

    var self = this;
    this.loopCoords(this.startCoord, this.endCoord, function(i, j, k) {
      self.editor.blocks.set(i, j, k, index);
    });
  }

  if (this.input.mouseUp() && this.blocksCopy != null) {
    this.editor.blocks.deserialize(this.blocksCopy);

    var coords = [];

    this.loopCoords(this.startCoord, this.endCoord, function(i, j, k) {
      coords.push(new THREE.Vector3(i, j, k));
    });

    var command = new SetCommand(this.editor.blocks, coords, index);
    this.editor.runCommand(command);
    this.editor.updateLastBlocks();

    this.startCoord = null;
    this.endCoord = null;
    this.blocksCopy = null;
  }
};

FillTool.prototype.loopCoords = function(startCoord, endCoord, callback) {
  var min = new THREE.Vector3(
    Math.min(startCoord.x, endCoord.x),
    Math.min(startCoord.y, endCoord.y),
    Math.min(startCoord.z, endCoord.z)
  );

  var max = new THREE.Vector3(
    Math.max(startCoord.x, endCoord.x),
    Math.max(startCoord.y, endCoord.y),
    Math.max(startCoord.z, endCoord.z)
  );

  for (var i = min.x; i <= max.x; i++) {
    for (var j = min.y; j <= max.y; j++) {
      for (var k = min.z; k <= max.z; k++) {
        callback(i, j, k);
      }
    }
  }
};

module.exports = FillTool;