var cpr = require('../../cpr/cpr');
var EditorTools = require('../editortools');

module.exports = function(editor) {
  var bar = cpr({
    data: [{
      src: '/images/plus.png',
      toolname: EditorTools.Pen,
      tooltip: 'pen tool (1)'
    }, {
      src: '/images/sampler.png',
      toolname: EditorTools.Sample,
      tooltip: 'sample tool (2)'
    }, {
      src: '/images/lasso.png',
      toolname: EditorTools.Select,
      tooltip: 'lasso tool (3)'
    }, {
      src: '/images/camera.png',
      toolname: EditorTools.Camera,
      tooltip: 'camera tool (4 or drag empty space)'
    }, {
      src: '/images/fill.png',
      toolname: EditorTools.Fill
    }],
    blockWidth: 32,
    blockHeight: 32,
    onPick: function(obj) {
      editor.toolName = obj.toolname;
      editor.updateTool();
    },
    customPlacement: true,
    showTooltip: true,
    paddingRight: 5
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.classList.add('toolbar');

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = 20 + 'px';
  bar.domElement.style.left = 20 + 'px';

  return bar;
};