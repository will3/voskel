var THREE = require('three');

var app = b();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Regsiter values
app.value('app', app);
app.value('scene', scene);
app.value('camera', camera);

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

// Attach camera control
app.attach(camera, require('./components/playerCamera'));

var container = document.getElementById('container');

app.use(require('./systems/renderer')(scene, camera, container));
var input = app.use(require('./systems/input')(container));
app.value('input', input);

var voxel = require('./voxel/voxel')();
app.use(voxel);

var devConsole = require('./systems/console')({
  onblur: function() {
    container.focus();
  }
});
app.use(devConsole);
app.value('devConsole', devConsole);

app.loadAssembly(require('./assemblies/aground'));
app.loadAssembly(require('./assemblies/aplayer'));

voxel.ground = app.get('ground');

app.start();