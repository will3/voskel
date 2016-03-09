var cpr = require('./cpr');
var EditorTools = require('../editortools');

module.exports = function(editor) {
  var bar = cpr({
    data: [{
      src: '/images/icons/pencil_light.png',
      srcActive: '/images/icons/pencil_dark.png',
      toolname: EditorTools.Pen,
      tooltip: 'pen tool (1)'
    }, {
      src: '/images/icons/sampler_light.png',
      srcActive: '/images/icons/sampler_dark.png',
      toolname: EditorTools.Sample,
      tooltip: 'sample tool (2)'
    }, {
      src: '/images/icons/lasso_light.png',
      srcActive: '/images/icons/lasso_dark.png',
      toolname: EditorTools.Select,
      tooltip: 'lasso tool (3)'
    }, {
      src: '/images/icons/camera_light.png',
      srcActive: '/images/icons/camera_dark.png',
      toolname: EditorTools.Camera,
      tooltip: 'camera tool (4 or drag empty space)'
    }, {
      src: '/images/icons/fill_light.png',
      srcActive: '/images/icons/fill_dark.png',
      toolname: EditorTools.Fill,
      tooltip: 'block tool (5) (drag and drop between two points)'
    }],
    blockWidth: 32,
    blockHeight: 32,
    onPick: function(obj) {
      editor.toolName = obj.toolname;
      editor.updateTool();
    },
    customPlacement: true,
    showTooltip: true,
    hideHighlight: true,
    isButton: true,
    stickySelection: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.classList.add('toolbar');

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = 20 + 'px';
  bar.domElement.style.left = 20 + 'px';

  return bar;
};