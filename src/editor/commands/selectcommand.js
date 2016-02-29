var arrayUtils = require('../../utils/arrayutils');

module.exports = function(editor, selections) {
  var originalSelections = null;
  return {
    run: function() {
      originalSelections = arrayUtils.clone(editor.selections);
      editor.selections = selections;
    },

    undo: function() {
      editor.selections = originalSelections;
    }
  };
};