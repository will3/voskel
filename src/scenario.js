var APlayer = require('./entities/aplayer');
var AGround = require('./entities/aground');

module.exports = function(app) {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Regsiter values
  app.value('app', app);
  app.value('scene', scene);
  app.value('camera', camera);

  // Regsiter entities
  app.registerEntity('player', APlayer);
  app.registerEntity('ground', AGround);

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

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(50%, 50%, 50%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  app.value('textures', textures);
  app.value('materials', materials);

  // Attach camera control
  trackball = app.attach(camera, require('./components/trackball'));

  var physics = app.use(require('./plugins/physics'));
  app.value('physics', physics);

  var input = app.use(require('./plugins/input'));
  app.value('input', input);

  var renderer = app.use(require('./plugins/renderer'), scene, camera);
  app.value('renderer', renderer);

  app.use(require('./plugins/stats'));

  // Spawn entities
  app.spawn('player', {
    position: [0, 40, 0]
  });

  var ground = app.spawn('ground', {
    hasEditor: true,
    camera: camera
  });

  // Configure physics ground
  physics.ground = ground.blocksComponent;
};