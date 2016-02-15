var THREE = require('three');
var b = require('./core/b');

var app = b();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Regsiter values
app.value('app', app);
app.value('scene', scene);
app.value('camera', camera);
app.value('config', require('./data/config.json'));

var textures = [
  THREE.ImageUtils.loadTexture('images/1.png'),
  THREE.ImageUtils.loadTexture('images/2.png'),
  THREE.ImageUtils.loadTexture('images/98.png'),
  THREE.ImageUtils.loadTexture('images/99.png')
];

var materials = [];

for (var i = 0; i < textures.length; i++) {
  var texture = textures[i];
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  materials.push(new THREE.MeshLambertMaterial({
    map: texture
  }));
}

app.value('textures', textures);
app.value('materials', materials);

var container = document.getElementById('container');
app.use(require('./systems/renderer')(scene, camera, container));
app.use('input', require('./systems/input')(container));
app.use(require('./voxel/voxel')());
var devConsole = require('./systems/devconsole')({
  onblur: function() {
    container.focus();
  }
});
app.use('devConsole', devConsole);

// Attach camera control
function loadGame() {
  app.attach(camera, require('./components/playerCamera'));

  app.loadAssembly(require('./assemblies/aground'));

  var player = app.loadAssembly(require('./assemblies/aplayer'));
  app.value('player', player);
};

function loadEditor() {
  app.attach(camera, require('./components/dragcamera'));
  app.loadAssembly(require('./assemblies/aeditor'));
}

loadEditor();

app.start();