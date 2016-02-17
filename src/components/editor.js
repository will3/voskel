var THREE = require('three');
var cpr = require('../cpr/cpr');
var CBuffer = require('cbuffer');

var Editor = function(object, app, input, camera, devConsole, config, palette) {
  this.object = object;
  this.app = app;
  this.input = input;
  this.camera = camera;
  this.devConsole = devConsole;
  this.config = config;
  this.palette = palette;

  this.sn = 0.0001;

  this.blocks = null;
  this.dragCamera = null;

  this.objGround = null;
  this.objBoundingBox = null;
  this.objHighlight = null;
  this.objShadow = null;

  this._started = false;
  this.lastMouse = new THREE.Vector2();
  this.mouseSampleInterval = 4;

  this.materials = [];
  this.materialIndex = 1;

  this.undos = CBuffer(200);
  this.redos = CBuffer(200);

  this.objShadowNeedsUpdate = false;
};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette'];

Editor.prototype.start = function() {
  this.blocks = this.app.attach(this.object, require('./blocks'));

  for (var i = 0; i < this.palette.length; i++) {
    this.materials.push(new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.palette[i]).getHex()
    }));
  }

  this.updateMaterial(this.blocks);

  // Create color picker
  var self = this;
  cpr({
    columns: 16,
    palette: this.palette,
    onPick: function(color, index) {
      self.materialIndex = index + 1;
    }
  });

  // Hook up console commands
  var self = this;
  this.devConsole.commands['size'] = function(args) {
    var defaultSize = self.config['editor_default_size'];
    var x = args._[0] || defaultSize[0];
    var y = args._[1] || args._[0] || defaultSize[1];
    var z = args._[2] || args._[0] || defaultSize[2];

    self.updateSize([x, y, z]);
  };

  this.devConsole.commands['offset'] = function(args) {
    var x = args._[0] || 0;
    var y = args._[1] || 0;
    var z = args._[2] || 0;

    self.blocks.setOffset(new THREE.Vector3(x, y, z));
  };

  this.devConsole.commands['save'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      window.localStorage.setItem('b_saves', {});
      throw err;
    }

    var name = args._[0];

    if (name.length === 0) {
      throw new Error('Usage: save [name]');
    }

    saves[name] = self.serialize();

    window.localStorage.setItem('b_saves', JSON.stringify(saves));
  };

  this.devConsole.commands['delete'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      window.localStorage.setItem('b_saves', {});
      throw err;
    }

    var name = args._[0];

    if (name.length === 0) {
      throw new Error('Usage: delete [name]');
    }
    delete saves[name];

    window.localStorage.setItem('b_saves', JSON.stringify(saves));
  };

  this.devConsole.commands['load'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      window.localStorage.setItem('b_saves', {});
      throw err;
    }

    var name = args._[0];

    self.deserialize(saves[name]);
  };

  this.dragCamera = this.app.attach(this.camera, require('./dragcamera'));

  this.updateSize(this.config['editor_default_size']);
};

Editor.prototype.updateObjShadow = function() {
  this.objShadow = this.blocks.obj.clone();
};

Editor.prototype.tick = function() {
  if (!this._started) {
    this.start();
    this._started = true;
  }

  var coord = this.getCoordToAdd(this.input.mouse);

  if (this.input.mouseDown() && coord != null) {
    this.dragCamera.lockRotation = true;
  }

  if (this.input.mouseUp()) {
    this.dragCamera.lockRotation = false;
  }

  this.updateHighlight(coord);

  if (this.input.mouseDown() || this.input.mouseUp() || this.objShadowNeedsUpdate) {
    this.updateObjShadow();
    this.objShadowNeedsUpdate = false;
  }

  if (this.input.mouseClick(0)) {
    var coord = this.getCoordToAdd(this.input.mouse);
    if (!!coord) {
      coord = this.blocks.getCoordWithOffset(coord);
      if (this.blocks.getAtCoord(coord) !== this.materialIndex) {
        this.runCommand(new SetCommand(this.blocks, [coord], this.materialIndex));
        this.objShadowNeedsUpdate = true;
      }
    }
  }

  if (this.input.mouseClick(2)) {
    var coord = this.getCoordToRemove(this.input.mouse);
    if (!!coord) {
      coord = this.blocks.getCoordWithOffset(coord);
      if (!!this.blocks.getAtCoord(coord)) {
        this.runCommand(new SetCommand(this.blocks, [coord], 0));
        this.objShadowNeedsUpdate = true;
      }
    }
  }

  if (this.input.mouseHold(0) && this.dragCamera.lockRotation && this.input.mouseMove()) {
    var points = this.getMousePoints(this.lastMouse, this.input.mouse, this.mouseSampleInterval);
    var coords = [];
    for (var i = 0; i < points.length; i++) {
      var coord = this.getCoordToAdd(points[i]);
      if (!!coord) {
        coord = this.blocks.getCoordWithOffset(coord);
        if (this.blocks.getAtCoord(coord) !== this.materialIndex) {
          coords.push(coord);
        }
      }
    }

    coords = uniqueCoords(coords);
    if (coords.length > 0) {
      this.runCommand(new SetCommand(this.blocks, coords, this.materialIndex));
    }
  }

  if (this.input.mouseHold(2) && this.dragCamera.lockRotation && this.input.mouseMove()) {
    var points = this.getMousePoints(this.lastMouse, this.input.mouse, this.mouseSampleInterval);
    var coords = [];
    for (var i = 0; i < points.length; i++) {
      var coord = this.getCoordToRemove(points[i], this.sn);
      if (!!coord) {
        coord = this.blocks.getCoordWithOffset(coord);
        if (!!this.blocks.getAtCoord(coord)) {
          coords.push(coord);
        }
      }
    }

    coords = uniqueCoords(coords);
    if (coords.length > 0) {
      this.runCommand(new SetCommand(this.blocks, coords, 0));
    }
  }

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

  if (this.input.keyHold('command') && this.input.keyHold('shift')) {
    if (this.input.keyDown('z')) {
      this.redo();
    }
  } else if (this.input.keyHold('command')) {
    if (this.input.keyDown('z')) {
      this.undo();
    }
  }

  this.lastMouse = this.input.mouse.clone();
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
  diff = diff.setLength(diff.length() + delta || 0);
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

Editor.prototype.getCoordToAdd = function(point) {
  var objects = [];
  if (this.objShadow != null) objects.push(this.objShadow);
  if (this.objGround != null) objects.push(this.objGround);
  return this.getCoord(objects, point, -this.sn);
};

Editor.prototype.getCoordToRemove = function(point) {
  var objects = [];
  if (this.objShadow != null) objects.push(this.objShadow);
  return this.getCoord(objects, point, this.sn);
};

Editor.prototype.getMousePoints = function(from, to, maxDis) {
  var distance = new THREE.Vector2().subVectors(to, from).length();

  var interval = Math.ceil(distance / maxDis);
  var step = new THREE.Vector2().subVectors(to, from).setLength(distance / interval);

  var list = [];
  var start = from.clone();
  list.push(start);
  for (var i = 0; i < interval; i++) {
    start.add(step);
    list.push(start.clone());
  }
  return list;
};

Editor.prototype.serialize = function() {
  var json = {};
  json.blocks = this.blocks.serialize();
  return json;
};

Editor.prototype.deserialize = function(json) {
  this.blocks.deserialize(json.blocks);
};

function uniqueCoords(coords) {
  var map = {};
  for (var i = 0; i < coords.length; i++) {
    map[coords[i].toArray().join(',')] = coords[i];
  }
  var list = [];
  for (var id in map) {
    list.push(map[id]);
  }
  return list;
};

var SetCommand = function(blocks, coords, value) {
  this.blocks = blocks;
  this.coords = coords;
  this.value = value;

  this.original = {};
};

SetCommand.prototype.run = function() {
  for (var i = 0; i < this.coords.length; i++) {
    var coord = this.coords[i];
    var b = this.blocks.getAtCoord(coord);
    var hash = coord.toArray().join(',');
    this.original[hash] = b;

    this.blocks.setAtCoord(coord, this.value);
  }
};

SetCommand.prototype.undo = function() {
  for (var id in this.original) {
    var items = id.split(',');
    var coord = new THREE.Vector3(parseInt(items[0]), parseInt(items[1]), parseInt(items[2]));
    this.blocks.setAtCoord(coord, this.original[id]);
  }
};

module.exports = Editor;