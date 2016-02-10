var a_player = require('./assemblies/a_player');
var a_ground = require('./assemblies/a_ground');

module.exports = function(app, scene, camera) {
  app.value('app', app);

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

  trackball = app.attach(camera, require('./components/trackball'));
  app.value('camera', camera);

  var events = app.use(require('./systems/events'));
  app.value('events', events);

  var physics = app.use(require('./systems/physics'));
  app.value('physics', physics);

  var input = app.use(require('./systems/input'));
  app.value('input', input);

  // Player
  var player0 = a_player(app);
  player0.object.position.set(0, 20, 0);
  scene.add(player0.object);

  var ground = a_ground(app, {
    hasEditor: true,
    camera: camera
  });
  scene.add(ground.object);
  physics.ground = ground.blocks;
};