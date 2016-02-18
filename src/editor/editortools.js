var PenTool = require('./tools/pentool');
var SelectTool = require('./tools/selecttool');

module.exports = {
  pen: function(editor) {
    return new PenTool(editor);
  },
  select: function(editor) {
    return new SelectTool(editor);
  }
};