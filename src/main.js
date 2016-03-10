var THREE = require('three');
var b = require('./core/b');
// var stats = require('./services/stats');

var app = b('main');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Regsiter values
app.value('app', app);
app.value('scene', scene);
app.value('camera', camera);
app.value('config', require('./data/config.json'));
app.value('palette', require('./data/palette.json'));
app.value('materials', require('./services/materials'));
app.value('canvas', document.getElementById('canvas'));

var container = document.getElementById('container');
app.use(require('./systems/renderer')(scene, camera, container));
app.use('input', require('./systems/input')(container));
app.use(require('./voxel/voxel')());

var devConsole = require('./services/devconsole')({
  onblur: function() {
    container.focus();
  }
});
app.value('devConsole', devConsole);

var prefabService = require('./services/prefabservice')();
app.value('prefabService', prefabService);

// stats(app);

// Attach camera control
function loadGame() {
  app.attach(camera, require('./components/playerCamera'));

  app.loadAssembly(require('./assemblies/aground'));

  var player = app.loadAssembly(require('./assemblies/aplayer'));
  app.value('player', player);
};

function loadEditor() {
  app.loadAssembly(require('./assemblies/aeditor'));
}

loadEditor();

app.start();

var canvas = document.getElementById('canvas');
app.on('beforeTick', function() {
  if (canvas.width !== window.innerWidth) {
    canvas.width = window.innerWidth;
  }
  if (canvas.height !== window.innerHeight) {
    canvas.height = window.innerHeight;
  }
});