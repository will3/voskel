var a_player = require('./assemblies/a_player');
var a_ground = require('./assemblies/a_ground');

module.exports = function(app, scene, camera) {
  app.value('app', app);

  var textures = {
    'default': THREE.ImageUtils.loadTexture('images/texture.png'),
    'grass': THREE.ImageUtils.loadTexture('images/grass.png')
  };

  for (var i in textures) {
    var texture = textures[i];
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }

  app.value('textures', textures);

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