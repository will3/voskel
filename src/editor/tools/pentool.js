var SetCommand = require('../commands/setcommand');

var PenTool = function(editor) {

  this.editor = editor;

  this.camera = this.editor.camera;

  this.input = this.editor.input;

  this.blocks = this.editor.blocks;

  this.object = this.editor.object;

  this.objShadow = null;

  this.objShadowNeedsUpdate = false;

  this.objHighlight = null;

  this.sn = 0.0001;

  this.lastMouse = new THREE.Vector2();

  this.mouseSampleInterval = 4;
};

PenTool.prototype.tick = function() {
  var coord = this.getCoordToAdd(this.input.mouse);

  if (this.input.mouseDown() && coord != null) {
    this.editor.setLockCamera(true);
  }

  if (this.input.mouseUp()) {
    this.editor.setLockCamera(false);
  }

  if (coord != null) {
    this.updateHighlight(coord);
  }

  if (this.input.mouseDown() || this.input.mouseUp() || this.objShadowNeedsUpdate) {
    this.updateObjShadow();
    this.objShadowNeedsUpdate = false;
  }

  if (this.input.mouseClick(0)) {
    var coord = this.getCoordToAdd(this.input.mouse);
    if (!!coord) {
      coord = this.blocks.getCoordAddOffset(coord);
      if (this.blocks.getAtCoord(coord) !== this.editor.paletteIndex) {
        this.editor.runCommand(new SetCommand(this.blocks, [coord], this.editor.paletteIndex));
        this.objShadowNeedsUpdate = true;
      }
    }
  }

  if (this.input.mouseClick(2)) {
    var coord = this.getCoordToRemove(this.input.mouse);
    if (!!coord) {
      coord = this.blocks.getCoordAddOffset(coord);
      if (!!this.blocks.getAtCoord(coord)) {
        this.editor.runCommand(new SetCommand(this.blocks, [coord], 0));
        this.objShadowNeedsUpdate = true;
      }
    }
  }

  if (this.input.mouseHold(0) && this.editor.lockCamera && this.input.mouseMove()) {
    var points = this.getMousePoints(this.lastMouse, this.input.mouse, this.mouseSampleInterval);
    var coords = [];
    for (var i = 0; i < points.length; i++) {
      var coord = this.getCoordToAdd(points[i]);
      if (!!coord) {
        coord = this.blocks.getCoordAddOffset(coord);
        if (this.blocks.getAtCoord(coord) !== this.editor.paletteIndex) {
          coords.push(coord);
        }
      }
    }

    coords = uniqueCoords(coords);
    if (coords.length > 0) {
      this.editor.runCommand(new SetCommand(this.blocks, coords, this.editor.paletteIndex));
    }
  }

  if (this.input.mouseHold(2) && this.editor.lockCamera && this.input.mouseMove()) {
    var points = this.getMousePoints(this.lastMouse, this.input.mouse, this.mouseSampleInterval);
    var coords = [];
    for (var i = 0; i < points.length; i++) {
      var coord = this.getCoordToRemove(points[i], this.sn);
      if (!!coord) {
        coord = this.blocks.getCoordAddOffset(coord);
        if (!!this.blocks.getAtCoord(coord)) {
          coords.push(coord);
        }
      }
    }

    coords = uniqueCoords(coords);
    if (coords.length > 0) {
      this.editor.runCommand(new SetCommand(this.blocks, coords, 0));
    }
  }

  this.lastMouse = this.input.mouse.clone();
};

PenTool.prototype.dispose = function() {
  this.object.remove(this.objHighlight);
  this.editor.setLockCamera(false);
};

PenTool.prototype.getCoordToAdd = function(point) {
  var objects = [];
  if (this.objShadow != null) objects.push(this.objShadow);
  if (this.editor.objGround != null) objects.push(this.editor.objGround);
  return this.getCoord(objects, point, -this.sn);
};

PenTool.prototype.getCoordToRemove = function(point) {
  var objects = [];
  if (this.objShadow != null) objects.push(this.objShadow);
  return this.getCoord(objects, point, this.sn);
};

PenTool.prototype.getCoord = function(objects, atPoint, delta) {
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

PenTool.prototype.getMousePoints = function(from, to, maxDis) {
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

PenTool.prototype.updateObjShadow = function() {
  this.objShadow = this.editor.blocks.obj.clone();
  this.objShadow.updateMatrixWorld();
};


PenTool.prototype.updateHighlight = function(coord) {
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

module.exports = PenTool;