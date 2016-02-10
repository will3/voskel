var APlayer = require('./entities/aplayer');
var AGround = require('./entities/aground');

module.exports = function(app, scene, camera) {
  // Regsiter values
  app.value('app', app);
  app.value('scene', scene);
  app.value('camera', camera);

  // Regsiter entities
  app.registerEntity('player', APlayer);
  app.registerEntity('ground', AGround);

  // Initialize textures
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

  // Attach camera control
  trackball = app.attach(camera, require('./components/trackball'));

  // Initialize systems
  var events = app.use(require('./systems/events'));
  app.value('events', events);

  var physics = app.use(require('./systems/physics'));
  app.value('physics', physics);

  var input = app.use(require('./systems/input'));
  app.value('input', input);

  // Spawn entities
  app.spwan('player', {
    position: [0, 20, 0]
  });

  app.spwan('ground', {
    hasEditor: true,
    camera: camera
  });

  // Configure physics ground
  physics.ground = ground.blocksComponent;
};