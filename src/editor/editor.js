var THREE = require('three');
var CBuffer = require('cbuffer');

var blocksComponent = require('../components/blocks');
var dragCameraComponent = require('./dragcamera');
var editorConsole = require('./editorconsole');
var EditorTools = require('./editortools');
var OffsetCommand = require('./commands/offsetcommand');
var Blocks = require('../components/blocks');
var arrayUtils = require('../utils/arrayutils');

var toolBar = require('./gui/toolbar');
var arrowBar = require('./gui/arrowbar');
var fileBar = require('./gui/filebar');
var prefabsBar = require('./gui/prefabsbar');
var prefabsToolBar = require('./gui/prefabstoolbar');
var colorBar = require('./gui/colorbar');
var propertyPanel = require('./gui/propertypanel');

var PenTool = require('./tools/pentool');
var SampleTool = require('./tools/sampletool');
var SelectTool = require('./tools/selecttool');
var CameraTool = require('./tools/cameratool');
var FillTool = require('./tools/filltool');

var VERSION = '1.0';
var KEY_SAVE = 'save';

var Editor = function(object, app, input, camera, devConsole, config, palette, canvas, cache) {

  this.object = object;

  this.app = app;

  this.input = input;

  this.camera = camera;

  this.devConsole = devConsole;

  this.config = config;

  this.palette = palette;

  this.canvas = canvas;

  this.cache = cache;

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

  this.toolBar = null;

  this.arrowBar = null;

  this.fileBar = null;

  this.toolNames = [EditorTools.Pen, EditorTools.Sample, EditorTools.Select, EditorTools.Camera, EditorTools.Fill];

  this.toolName = EditorTools.Pen;
  this.lastTool = this.toolName;

  this.tool = null;

  this.selections = [];

  this.reflectX = false;

  this.reflectY = false;

  this.reflectZ = false;

  // loaded saves
  this.prefabs = [];

  this.screenshotRenderer = null;

  // Copy of block object
  this.lastBlocks = null;

  this.objHighlight = null;

  this.sn = 0.0001;

  this.highlightCoord = null;

  this.downloadElement = null;

  this.editLock = false;

  this.cameraLock = false;

  this.propertyPanel = null;

  this.prefabIndex = 0;

  this.lastTool = null;
};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette', 'canvas', 'cache'];

Editor.prototype.start = function() {
  editorConsole(this, this.devConsole);

  this.selectedColor = this.palette[0];

  var save = this.cache.get(KEY_SAVE);
  if (save != null) {
    if (save.version !== VERSION) {
      // Migrate
    } else {
      this.prefabs = save.prefabs || [];  
      this.selectedColor = save.selectedColor;
    }
  }

  this.blocks = this.app.attach(this.object, blocksComponent);

  this.dragCamera = this.app.attach(this.camera, dragCameraComponent);

  this.updateTool();

  this.updateMaterial(this.blocks);

  // Set up GUI
  this.toolBar = toolBar(this);
  this.arrowBar = arrowBar(this);
  this.fileBar = fileBar(this);
  this.colorBar = colorBar(this);
  this.prefabsBar = prefabsBar(this);
  this.prefabsToolbar = prefabsToolBar(this);
  this.propertyPanel = propertyPanel(this);

  if (this.prefabs.length === 0) {
    this.prefabs.push(this.blocks.serialize());
  }

  this.load(this.prefabs[0]);
  this.updateScreenshots();

  this.setSelectedColor(this.selectedColor);
  this.prefabsBar.highlight(0);
  this.toolBar.highlight(0);
};

Editor.prototype.load = function(data) {
  this.blocks.deserialize(data);

  this.updateSize(this.blocks.dim);

  this.updateLastBlocks();

  this.updatePropertyPanel();
};

Editor.prototype.setTool = function(name) {
  var index = arrayUtils.indexOf(this.toolNames, name);
  if (index === -1) {
    return;
  }

  this.toolBar.highlight(index);
  this.lastTool = this.toolName;
  this.toolName = name;
  this.updateTool();
};

Editor.prototype.tick = function() {
  if (!this._started) {
    this.start();
    this._started = true;
  }

  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  var hasIntersect = this.getCoordAbove() != null;

  if (!hasIntersect && this.input.mouseDown()) {
    this.editLock = true;
  }

  if (hasIntersect && this.input.mouseDown()) {
    this.cameraLock = true;
  }

  if (this.input.mouseUp()) {
    this.editLock = false;
    this.cameraLock = false;
  }

  if (this.toolName === EditorTools.Select || this.toolName === EditorTools.Sample) {
    this.cameraLock = true;
  } else if (this.toolName === EditorTools.Camera) {
    this.cameraLock = false;
  }

  this.dragCamera.lock = this.cameraLock;

  this.tool.tick();

  this.updateHighlight(this.highlightCoord);

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
    this.applyOffset(offsetCoord);
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
    this.setTool(this.toolNames[0]);
  } else if (this.input.keyDown('2')) {
    this.setTool(this.toolNames[1]);
  } else if (this.input.keyDown('3')) {
    this.setTool(this.toolNames[2]);
  } else if (this.input.keyDown('4')) {
    this.setTool(this.toolNames[3]);
  } else if (this.input.keyDown('5')) {
    this.setTool(this.toolNames[4]);
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
  this.save();
};

Editor.prototype.updateCurrentScreenshot = function() {
  var index = this.prefabIndex;
  this.prefabs[index] = this.blocks.serialize();
  this.updateScreenshotAtIndex(index);
};

Editor.prototype.updateScreenshots = function() {
  this.prefabsBar.clear();

  for (var i = 0; i < this.prefabs.length; i++) {
    this.updateScreenshotAtIndex(i);
  }
};

Editor.prototype.updateScreenshotAtIndex = function(index) {
  var prefab = this.prefabs[index];
  var imgData = this.screenshot(prefab);

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
  this.updateCurrentPrefab();
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

  if (this.toolName === EditorTools.Pen) {
    this.tool = new PenTool(this);
  } else if (this.toolName === EditorTools.Sample) {
    this.tool = new SampleTool(this);
  } else if (this.toolName === EditorTools.Select) {
    this.tool = new SelectTool(this);
  } else if (this.toolName === EditorTools.Camera) {
    this.tool = new CameraTool(this);
  } else if (this.toolName === EditorTools.Fill) {
    this.tool = new FillTool(this);
  } else {
    throw new Error('cannot make tool named: ' + this.toolName);
  }

  if (this.tool.start != null) {
    this.tool.start();
  }
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

Editor.prototype.createNew = function(index) {
  index = index || this.prefabs.length;

  this.blocks.clear();
  var prefab = this.blocks.serialize();
  this.prefabs.splice(index, 0, prefab);
  this.updateScreenshotAtIndex(index);
  this.prefabIndex = index;
  this.prefabsBar.highlight(index);
  this.updatePropertyPanel();
  this.updateLastBlocks();
};

Editor.prototype.removeSelected = function() {
  this.prefabs.splice(this.prefabIndex, 1);

  if (this.prefabs.length === 0) {
    this.blocks.clear();
    this.prefabs.push(this.blocks.serialize());
    this.updatePropertyPanel();
  }

  if (this.prefabIndex > this.prefabs.length - 1) {
    this.prefabIndex = this.prefabs.length - 1;
    this.prefabsBar.highlight(this.prefabIndex);
    this.blocks.deserialize(this.prefabs[this.prefabIndex]);
    this.updatePropertyPanel();
  }

  this.updateScreenshots();
  this.updateLastBlocks();
};

Editor.prototype.createClone = function() {
  var prefab = this.blocks.serialize();
  this.createNew(this.prefabIndex + 1);
  this.blocks.deserialize(prefab);
  this.updateCurrentPrefab();

  this.updateScreenshots();
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

Editor.prototype.updatePropertyPanel = function() {
  var prefab = this.getSelectedPrefab();

  this.propertyPanel.controllers['name'].setValue(prefab.userData.name || 'unnamed');

  var dim = prefab.dim;
  var formattedSize = dim.join(' ');
  this.propertyPanel.controllers['size'].setValue(formattedSize);
};

Editor.prototype.save = function() {
  var save = {
    version: VERSION,
    prefabs: this.prefabs,
    selectedColor: this.selectedColor
  };

  this.cache.set(KEY_SAVE, save);

  return save;
};

Editor.prototype.updateLastBlocks = function() {
  this.blocks.updateMesh();
  this.lastBlocks = this.blocks.obj.clone();
  this.lastBlocks.updateMatrixWorld();
};

Editor.prototype.getCoordAbove = function(point) {
  point = point || this.input.mouse;
  var objects = [];
  if (this.lastBlocks != null) objects.push(this.lastBlocks);
  if (this.objGround != null) objects.push(this.objGround);
  return this.getCoord(objects, point, -this.sn);
};

Editor.prototype.getCoordBelow = function(point) {
  point = point || this.input.mouse;
  var objects = [];
  if (this.lastBlocks != null) objects.push(this.lastBlocks);
  var coord = this.getCoord(objects, point, this.sn);

  if (coord == null && this.objGround != null) {
    return this.getCoord([this.objGround], point, -this.sn);
  }

  return coord;
};

Editor.prototype.getCoord = function(objects, atPoint, delta) {
  var viewport = this.input.screenToViewport(atPoint);
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(viewport, this.camera);
  var intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length === 0) {
    return undefined;
  }

  var intersect = intersects[0];

  var point = intersect.point;
  var diff = point.clone().sub(this.camera.position);
  diff = diff.setLength(diff.length() + (delta || 0));
  point = this.camera.position.clone().add(diff);

  var localPoint = this.blocks.obj.worldToLocal(point);
  var coord = this.blocks.pointToCoord(localPoint);
  coord = new THREE.Vector3(
    Math.round(coord.x),
    Math.round(coord.y),
    Math.round(coord.z)
  );

  return coord;
};

Editor.prototype.updateHighlight = function(coord) {
  if (this.objHighlight == null) {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    var wireframe = new THREE.EdgesHelper(mesh, 0xffffff);
    this.objHighlight = new THREE.Object3D();
    this.objHighlight.add(wireframe);
    this.object.add(this.objHighlight);
  }

  if (coord == null) {
    this.objHighlight.visible = false;
    return;
  }

  coord = coord.clone().add(new THREE.Vector3(0.5, 0.5, 0.5));
  this.objHighlight.visible = true;
  var localPoint = this.blocks.coordToPoint(coord);
  var worldPoint = this.blocks.obj.localToWorld(localPoint);
  this.objHighlight.position.copy(worldPoint);
};

Editor.prototype.setSelectedColor = function(color) {
  var index = arrayUtils.indexOf(this.palette, function(c) {
    return color === c || (color == null && c.isClearColor);
  });

  if (index == -1) {
    return;
  }

  this.selectedColor = color;
  this.colorBar.highlight(index);
};

Editor.prototype.applyOffset = function(offset) {
  var selectedCoords;
  if (this.selections.length > 0) {
    selectedCoords = this.selections;
  } else {
    selectedCoords = this.blocks.getAllCoords();
  }

  this.runCommand(new OffsetCommand(this, this.blocks, selectedCoords, offset));
  this.updateLastBlocks();
};

Editor.prototype.downloadJSON = function() {
  var json = this.save();

  var name = this.getSelectedPrefab().userData.name;

  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
  if (this.downloadElement == null) {
    this.downloadElement = document.createElement('a');
    this.downloadElement.style.visibility = 'hidden';
    document.body.appendChild(this.downloadElement);
  }
  this.downloadElement.setAttribute("href", dataStr);
  this.downloadElement.setAttribute("download", name + '.json');
  this.downloadElement.click();
};

Editor.prototype.getSelectedPrefab = function() {
  return this.prefabs[this.prefabIndex];
};

Editor.prototype.updateCurrentPrefab = function() {
  this.prefabs[this.prefabIndex] = this.blocks.serialize();
};

Editor.prototype.setLastTool = function() {
  this.setTool(this.lastTool);
};

module.exports = Editor;