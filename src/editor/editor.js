var THREE = require('three');
var cpr = require('../cpr/cpr');
var CBuffer = require('cbuffer');
var blocksComponent = require('../components/blocks');
var dragCameraComponent = require('../components/dragcamera');
var editorConsole = require('./editorconsole');
var editorTools = require('./editortools');
var OffsetCommand = require('./commands/offsetcommand');

var Editor = function(object, app, input, camera, devConsole, config, palette, canvas) {

  this.object = object;

  this.app = app;

  this.input = input;

  this.camera = camera;

  this.devConsole = devConsole;

  this.config = config;

  this.palette = palette;

  this.canvas = canvas;

  this.context = this.canvas.getContext('2d');

  this.blocks = null;

  this.dragCamera = null;

  this.objGround = null;

  this.objBoundingBox = null;

  this._started = false;

  this.materials = [];

  this.selectedColor = null;

  this.undos = CBuffer(200);

  this.redos = CBuffer(200);

  this.frames = [];

  this.currentFrame = 0;

  this.cpr = null;

  this.toolNames = ['pen', 'select'];

  this.toolName = 'pen';

  this.tool = null;

  this.lockCamera = false;

  this.selections = [];

  this.frameRate = 4;

  this.playing = false;

  this.playTimeout = null;

  this.allFrames = false;

  this.reflectX = false;

  this.reflectY = false;

  this.reflectZ = false;
};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette', 'canvas'];

Editor.prototype.start = function() {
  this.blocks = this.app.attach(this.object, blocksComponent);

  this.frames.push({
    data: this.blocks.serialize()
  });

  this.updateMaterial(this.blocks);

  this.selectedColor = this.palette[0][0];

  // Create color picker
  var self = this;
  this.cpr = cpr({
    palette: this.palette,
    onPick: function(color) {
      console.log(color);
      self.selectedColor = color;
    }
  });

  editorConsole(this, this.devConsole);

  this.dragCamera = this.app.attach(this.camera, dragCameraComponent);

  this.updateSize(this.config['editor_default_size']);

  this.updateTool();
};

Editor.prototype.tick = function() {
  if (!this._started) {
    this.start();
    this._started = true;
  }

  this.tool.tick();

  this.drawSelection();

  var offsetCoord = null;
  if (this.input.keyDown('f')) {
    offsetCoord = new THREE.Vector3(0, -1, 0);
  }
  if (this.input.keyDown('r')) {
    offsetCoord = new THREE.Vector3(0, 1, 0);
  }
  if (this.input.keyDown('a')) {
    offsetCoord = new THREE.Vector3(-1, 0, 0);
  }
  if (this.input.keyDown('d')) {
    offsetCoord = new THREE.Vector3(1, 0, 0);
  }
  if (this.input.keyDown('w')) {
    offsetCoord = new THREE.Vector3(0, 0, -1);
  }
  if (this.input.keyDown('s')) {
    offsetCoord = new THREE.Vector3(0, 0, 1);
  }

  if (offsetCoord != null) {
    var selectedCoords;
    if (this.selections.length > 0) {
      selectedCoords = this.selections;
    } else {
      selectedCoords = this.blocks.getAllCoords();
    }

    this.runCommand(new OffsetCommand(this, this.blocks, selectedCoords, offsetCoord));
  }

  if (this.input.keyHold('command') && this.input.keyHold('shift')) {
    if (this.input.keyDown('z')) {
      this.redo();
    }
  } else if (this.input.keyHold('command')) {
    if (this.input.keyDown('z')) {
      this.undo();
    }
  }

  if (this.input.keyDown(';')) {
    this.lastFrame();
  }

  if (this.input.keyDown('\'')) {
    this.nextFrame();
  }

  if (this.input.keyDown('1')) {
    this.toolName = this.toolNames[0];
    this.updateTool();
  } else if (this.input.keyDown('2')) {
    this.toolName = this.toolNames[1];
    this.updateTool();
  }
};

Editor.prototype.undo = function() {
  var command = this.undos.last();
  if (command == null) {
    return;
  }
  command.undo();
  this.undos.pop();
  this.redos.push(command);
};

Editor.prototype.redo = function() {
  var command = this.redos.last();
  if (command == null) {
    return;
  }
  command.run();
  this.redos.pop();
  this.undos.push(command);
};

Editor.prototype.runCommand = function(command) {
  command.run();
  this.undos.push(command);
  this.redos = CBuffer(200);
};

Editor.prototype.updateMaterial = function(blocks) {
  var materials = blocks.material.materials;
  for (var i = 0; i < this.materials.length; i++) {
    materials[i] = this.materials[i];
  }
};

Editor.prototype.updateSize = function(size) {
  this.blocks.setDim([size[0], size[1], size[2]]);
  this.blocks.obj.position.set(-size[0] / 2, -size[1] / 2, -size[2] / 2);
  this.updateGround(size);
  this.updateBoundingBox(size);

  // Max from 3 numbers
  var maxSize = Math.max(size[0], size[1], size[2]);
  this.dragCamera.distance = 2 * (maxSize);
};

Editor.prototype.updateGround = function(size) {
  if (this.objGround != null) {
    this.object.remove(this.objGround);
  }

  var geometry = new THREE.Geometry();
  geometry.vertices.push(
    new THREE.Vector3(-size[0] / 2, -size[1] / 2, -size[2] / 2),
    new THREE.Vector3(size[0] / 2, -size[1] / 2, -size[2] / 2),
    new THREE.Vector3(size[0] / 2, -size[1] / 2, size[2] / 2),
    new THREE.Vector3(-size[0] / 2, -size[1] / 2, size[2] / 2)
  );
  geometry.faces.push(
    new THREE.Face3(2, 1, 0),
    new THREE.Face3(0, 3, 2)
  );
  geometry.faceVertexUvs[0].push(
    [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(size[2] / 2, 0),
      new THREE.Vector2(size[2] / 2, size[0] / 2)
    ], [
      new THREE.Vector2(size[2] / 2, size[0] / 2),
      new THREE.Vector2(0, size[0] / 2),
      new THREE.Vector2(0, 0)
    ]
  );
  var material = materials['placeholder'];
  this.objGround = new THREE.Mesh(geometry, material);
  this.object.add(this.objGround);
};

Editor.prototype.updateBoundingBox = function(size) {
  if (this.objBoundingBox != null) {
    this.object.remove(this.objBoundingBox);
  }

  var geometry = new THREE.Geometry();

  var a = new THREE.Vector3(-size[0] / 2, -size[1] / 2, -size[2] / 2);
  var b = new THREE.Vector3(size[0] / 2, -size[1] / 2, -size[2] / 2);
  var c = new THREE.Vector3(size[0] / 2, -size[1] / 2, size[2] / 2);
  var d = new THREE.Vector3(-size[0] / 2, -size[1] / 2, size[2] / 2);

  var e = new THREE.Vector3(-size[0] / 2, size[1] / 2, -size[2] / 2);
  var f = new THREE.Vector3(size[0] / 2, size[1] / 2, -size[2] / 2);
  var g = new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
  var h = new THREE.Vector3(-size[0] / 2, size[1] / 2, size[2] / 2);

  geometry.vertices.push(a, e, b, f, c, g, d, h, e, f, f, g, g, h, h, e);

  var material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
  });
  this.objBoundingBox = new THREE.LineSegments(geometry, material);
  this.object.add(this.objBoundingBox);
};

Editor.prototype.addFrame = function() {
  this.frames.push({
    data: this.blocks.serialize()
  })

  this.currentFrame = this.frames.length - 1;
  this.updateCurrentFrame();
};

Editor.prototype.updateCurrentFrame = function() {
  if (this.frames.length === 0) {
    return;
  }

  var frame = this.frames[this.currentFrame];
  var data = frame.data;
  this.blocks.deserialize(data);
};

Editor.prototype.nextFrame = function() {
  if (this.frames.length === 0) {
    return;
  }

  this.saveCurrentFrame();

  this.currentFrame++;
  if (this.currentFrame === this.frames.length) {
    this.currentFrame = 0;
  }

  this.updateCurrentFrame();
};

Editor.prototype.lastFrame = function() {
  if (this.frames.length === 0) {
    return;
  }

  this.saveCurrentFrame();

  if (this.currentFrame > 0) {
    this.currentFrame--;
    this.updateCurrentFrame();
  }
};

Editor.prototype.saveCurrentFrame = function() {
  this.frames[this.currentFrame] = {
    data: this.blocks.serialize()
  };
};

Editor.prototype.serialize = function() {
  this.saveCurrentFrame();

  var json = {};
  json.frames = this.frames;

  return json;
};

Editor.prototype.deserialize = function(json) {
  this.frames = json.frames || [];
  this.updateCurrentFrame();
};

Editor.prototype.updateTool = function() {
  if (this.tool != null) {
    if (this.tool.dispose != null) {
      this.tool.dispose();
    }
  }

  var factory = editorTools[this.toolName];
  this.tool = factory(this);
};

Editor.prototype.setLockCamera = function(value) {
  this.lockCamera = value;
  this.dragCamera.lockRotation = value;
};

Editor.prototype.drawSelection = function() {
  var blocks = this.blocks;
  for (var i = 0; i < this.selections.length; i++) {
    var coord = this.selections[i];
    coord = coord.clone().add(new THREE.Vector3(0.5, 0.5, 0.5));
    var localPoint = blocks.coordToPoint(coord);
    var worldPoint = blocks.obj.localToWorld(localPoint);
    var vector = worldPoint.project(this.camera);
    vector.x = Math.round((vector.x + 1) * canvas.width / 2);
    vector.y = Math.round((-vector.y + 1) * canvas.height / 2);

    this.context.fillStyle = '#ffffff';
    this.context.fillRect(vector.x, vector.y, 1, 1);
  }
};

Editor.prototype.play = function() {
  if (this.frames <= 1) {
    return;
  }

  if (this.playing) {
    return;
  }

  this.playing = true;

  var self = this;
  var interval = function() {
    self.nextFrame(true);
    self.playTimeout = setTimeout(interval, 1000 / self.frameRate);
  };

  interval();
};

Editor.prototype.stop = function() {
  if (!this.playing) {
    return;
  }

  clearTimeout(this.playTimeout);
  this.playing = false;
};

Editor.prototype.createNew = function() {
  this.stop();
  this.frames = [];
  this.blocks.clear();
  this.updateSize(this.config['editor_default_size']);
};

Editor.prototype.screenshot = function() {
  var renderer = new THREE.WebGLRenderer({
    alpha: true
  });
  renderer.setClearColor(0xffffff, 0.0);

  var width = 100;
  var height = 100;
  renderer.setSize(width, height);

  var clonedObj = this.blocks.obj.clone();
  var scene = new THREE.Scene();
  scene.add(clonedObj);

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(60%, 60%, 60%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  var dim = this.blocks.dim;
  var maxSize = Math.max(dim[0], dim[1], dim[2]) * 2;

  var camera = new THREE.OrthographicCamera(maxSize / -2, maxSize / 2, maxSize / 2, maxSize / -2, 0.1, 1000);
  camera.position.set(0, 0, 10);

  var cameraPosition = new THREE.Vector3(0, 0, maxSize)
    .applyEuler(new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ'))
  camera.position.copy(cameraPosition);
  camera.lookAt(new THREE.Vector3());

  renderer.render(scene, camera);
  imgData = renderer.domElement.toDataURL();

  var img = document.createElement('img');
  img.width = '100';
  img.height = '100';
  img.src = imgData;
  img.style.position = 'absolute';
  img.style.right = '0px';
  img.style.top = '0px';

  document.body.appendChild(img);

  console.log(imgData);

  return imgData;
};

module.exports = Editor;