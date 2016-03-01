var THREE = require('three');
var cpr = require('../cpr/cpr');
var CBuffer = require('cbuffer');
var blocksComponent = require('../components/blocks');
var dragCameraComponent = require('../components/dragcamera');
var editorConsole = require('./editorconsole');
var editorTools = require('./editortools');
var OffsetCommand = require('./commands/offsetcommand');
var Blocks = require('../components/blocks');

var Editor = function(object, app, input, camera, devConsole, config, palette, canvas, saveService) {

  this.object = object;

  this.app = app;

  this.input = input;

  this.camera = camera;

  this.devConsole = devConsole;

  this.config = config;

  this.palette = palette;

  this.canvas = canvas;

  this.saveService = saveService;

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

  this.colorBar = null;

  this.prefabsBar = null;

  this.prefabToolbar = null;

  this.toolNames = ['pen', 'select'];

  this.toolName = 'pen';

  this.tool = null;

  this.lockCamera = false;

  this.selections = [];

  this.reflectX = false;

  this.reflectY = false;

  this.reflectZ = false;

  // loaded saves
  this.saves = [];

  this.screenshotRenderer = null;
};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette', 'canvas', 'saveService'];

Editor.prototype.start = function() {
  editorConsole(this, this.devConsole);

  this.saves = this.saveService.load();

  this.blocks = this.app.attach(this.object, blocksComponent);
  this.dragCamera = this.app.attach(this.camera, dragCameraComponent);

  this.updateTool();

  this.updateMaterial(this.blocks);

  this.selectedColor = this.palette[0];

  // Create color picker
  var self = this;
  this.colorBar = cpr({
    data: this.palette,
    onPick: function(color) {
      console.log(color);
      self.selectedColor = color;
    }
  });

  this.prefabsBar = cpr({
    onPick: function(obj, index) {
      self.load(self.saves[index]);
    },
    blockWidth: 48,
    blockHeight: 48
  });

  this.prefabsBar.domElement.style.bottom = '120px';

  var prefabToolbarData = [{
    button: 'plus',
    src: '/images/plus.png'
  }, {
    button: 'minus',
    src: '/images/minus.png'
  }, {
    button: 'clone',
    src: '/images/clone.png'
  }];

  this.prefabToolbar = cpr({
    data: prefabToolbarData,
    blockWidth: 32,
    blockHeight: 32,
    disableHighlight: true,
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'plus') {
        self.createNew();
      } else if (button === 'minus') {
        self.removeSelected();
      } else if (button === 'clone') {
        self.createClone();
      }
    }
  });

  this.prefabToolbar.domElement.style.bottom = '180px';

  if (this.saves.length === 0) {
    this.saves.push(this.blocks.serialize());
  }

  this.load(this.saves[0]);
  this.updateScreenshots();
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
  this.updateCurrentScreenshot();
};

Editor.prototype.redo = function() {
  var command = this.redos.last();
  if (command == null) {
    return;
  }
  command.run();
  this.redos.pop();
  this.undos.push(command);
  this.updateCurrentScreenshot();
};

Editor.prototype.runCommand = function(command) {
  command.run();
  this.undos.push(command);
  this.redos = CBuffer(200);
  this.updateCurrentScreenshot();
};

Editor.prototype.updateCurrentScreenshot = function() {
  var index = this.prefabsBar.selectedIndex;
  this.saves[index] = this.blocks.serialize();
  this.updateScreenshotAtIndex(index);
};

Editor.prototype.updateScreenshots = function() {
  this.prefabsBar.clear();

  for (var i = 0; i < this.saves.length; i++) {
    this.updateScreenshotAtIndex(i);
  }
};

Editor.prototype.updateScreenshotAtIndex = function(index) {
  var save = this.saves[index];
  var imgData = this.screenshot(save);

  this.prefabsBar.set(index, {
    imgData: imgData,
    index: index
  });
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

Editor.prototype.createNew = function() {
  this.blocks.clear();
  var save = this.blocks.serialize();
  this.saves.push(save);
  this.updateScreenshotAtIndex(this.saves.length - 1);
  this.prefabsBar.highlight(this.saves.length - 1);
};

Editor.prototype.removeSelected = function() {
  var selectedIndex = this.prefabsBar.selectedIndex;

  this.saves.splice(selectedIndex, 1);

  this.updateScreenshots();

  if (selectedIndex > this.saves.length - 1) {
    selectedIndex = this.saves.length - 1;
  }

  if (selectedIndex >= 0) {
    this.blocks.deserialize(this.saves[selectedIndex]);
  }else {
    this.blocks.clear();
  }
};

Editor.prototype.createClone = function() {
  var save = this.blocks.serialize();
  this.saves.push(save);
  this.updateScreenshotAtIndex(this.saves.length - 1);
  this.prefabsBar.highlight(this.saves.length - 1);
};

Editor.prototype.screenshot = function(data) {
  if (this.screenshotRenderer == null) {
    this.screenshotRenderer = new THREE.WebGLRenderer({
      alpha: true
    });
    this.screenshotRenderer.setClearColor(0xffffff, 0.0);
  }

  var renderer = this.screenshotRenderer;

  var width = 100;
  var height = 100;
  renderer.setSize(width, height);

  var object = new THREE.Object3D();
  var blocks = new Blocks(object);
  blocks.deserialize(data);
  blocks.tick();

  var dim = blocks.dim;

  blocks.obj.position.set(-dim[0] / 2, -dim[1] / 2, -dim[2] / 2);

  var objectClone = object.clone();
  var scene = new THREE.Scene();
  scene.add(objectClone);

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(60%, 60%, 60%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  var maxSize = Math.max(dim[0], dim[1], dim[2]) * 2;

  var camera = new THREE.OrthographicCamera(maxSize / -2, maxSize / 2, maxSize / 2, maxSize / -2, 0.1, 1000);
  camera.position.set(0, 0, 10);

  var cameraPosition = new THREE.Vector3(0, 0, maxSize)
    .applyEuler(new THREE.Euler(-Math.PI / 4, 0, 0, 'YXZ'))
  camera.position.copy(cameraPosition);
  camera.lookAt(new THREE.Vector3());

  renderer.render(scene, camera);
  imgData = renderer.domElement.toDataURL();

  renderer.dispose();

  return imgData;
};

Editor.prototype.load = function(data) {
  this.blocks.deserialize(data);

  this.blocks.tick();

  if (this.tool.onLoad != null) {
    this.tool.onLoad();
  }

  this.updateSize(this.blocks.dim);
};

Editor.prototype.reset = function() {
  this.saveService.reset();
};

Editor.prototype.save = function() {
  this.saveService.save(this.saves);
};

module.exports = Editor;