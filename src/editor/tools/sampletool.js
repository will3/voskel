var EditorTools = require('../editortools');

var SampleTool = function(editor) {
  this.editor = editor;
  this.input = this.editor.input;
  this.blocks = this.editor.blocks;
};

SampleTool.prototype.tick = function() {
  this.editor.highlightCoord = this.editor.getCoordBelow();

  if (this.input.mouseDown()) {
    var coord = this.editor.getCoordBelow();

    var color = null;
    if (coord != null) {
      var index = this.blocks.getAtCoord(coord);
      var color = this.blocks.palette[index];
      this.editor.setSelectedColor(color);

    } else {
      this.editor.setSelectedColor(null);
    }

    // this.editor.setTool(EditorTools.Pen);
  }
};

module.exports = SampleTool;