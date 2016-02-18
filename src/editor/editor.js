var THREE = require('three');
var cpr = require('../cpr/cpr');
var CBuffer = require('cbuffer');
var blocksComponent = require('../components/blocks');
var dragCameraComponent = require('../components/dragcamera');
var editorConsole = require('./editorconsole');
var editorTools = require('./editortools');

var Editor = function(object, app, input, camera, devConsole, config, palette) {

  this.object = object;

  this.app = app;

  this.input = input;

  this.camera = camera;

  this.devConsole = devConsole;

  this.config = config;

  this.palette = palette;

  this.blocks = null;

  this.dragCamera = null;

  this.objGround = null;

  this.objBoundingBox = null;

  this._started = false;

  this.materials = [];

  this.paletteIndex = 1;

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

};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette'];

Editor.prototype.start = function() {
  this.blocks = this.app.attach(this.object, blocksComponent);

  for (var i = 0; i < this.palette.length; i++) {
    this.materials.push(new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.palette[i]).getHex()
    }));
  }

  this.updateMaterial(this.blocks);

  // Create color picker
  var self = this;
  this.cpr = cpr({
    columns: 16,
    palette: this.palette,
    onPick: function(color, index) {
      self.paletteIndex = index + 1;
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

  if (this.selections.length > 0) {
    if (this.input.keyDown('f')) {
      this.blocks.addToOffset(new THREE.Vector3(0, 1, 0));
    }

    if (this.input.keyDown('r')) {
      this.blocks.addToOffset(new THREE.Vector3(0, -1, 0));
    }

    if (this.input.keyDown('a')) {
      this.blocks.addToOffset(new THREE.Vector3(1, 0, 0));
    }

    if (this.input.keyDown('d')) {
      this.blocks.addToOffset(new THREE.Vector3(-1, 0, 0));
    }

    if (this.input.keyDown('w')) {
      this.blocks.addToOffset(new THREE.Vector3(0, 0, 1));
    }

    if (this.input.keyDown('s')) {
      this.blocks.addToOffset(new THREE.Vector3(0, 0, -1));
    }
  } else {
    if (this.input.keyDown('f')) {
      this.offsetSelection(new THREE.Vector3(0, 1, 0));
    }

    if (this.input.keyDown('r')) {
      this.offsetSelection(new THREE.Vector3(0, -1, 0));
    }

    if (this.input.keyDown('a')) {
      this.offsetSelection(new THREE.Vector3(1, 0, 0));
    }

    if (this.input.keyDown('d')) {
      this.offsetSelection(new THREE.Vector3(-1, 0, 0));
    }

    if (this.input.keyDown('w')) {
      this.offsetSelection(new THREE.Vector3(0, 0, 1));
    }

    if (this.input.keyDown('s')) {
      this.offsetSelection(new THREE.Vector3(0, 0, -1));
    }
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
  if (this.frames.length === 0) {
    this.frames.push({
      data: this.blocks.serialize()
    });
  }

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

  if (this.currentFrame < this.frames.length - 1) {
    this.currentFrame++;
    this.updateCurrentFrame();
  }
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
  var json = {};
  json.blocks = this.blocks.serialize();
  json.frames = this.frames;
  json.currentFrame = this.currentFrame;
  json.paletteIndex = this.paletteIndex;

  return json;
};

Editor.prototype.deserialize = function(json) {
  this.blocks.deserialize(json.blocks);

  this.frames = json.frames || [];
  this.currentFrame = json.currentFrame;
  this.updateCurrentFrame();

  this.paletteIndex = json.paletteIndex || 1;
  this.updatePaletteIndex();
};

Editor.prototype.updatePaletteIndex = function() {
  this.cpr.highlight(this.paletteIndex - 1);
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

module.exports = Editor;