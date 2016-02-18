var SelectTool = function(editor) {
  this.editor = editor;
  this.input = this.editor.input;
  this.blocks = this.editor.blocks;
  this.camera = this.editor.camera;

  this.startPoint = null;
  this.endPoint = null;
  this.selectionRect = [];

  this.divSelectionBox = null;

  this.canvas = document.getElementById('canvas');
  this.context = this.canvas.getContext('2d');

  this.selections = [];
};

SelectTool.prototype.tick = function() {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  if (this.input.mouseDown(0)) {
    this.startPoint = this.input.mouse.clone();
  }

  if (this.input.mouseHold(0)) {
    this.editor.setLockCamera(true);
    this.endPoint = this.input.mouse.clone();
  } else {
    this.editor.setLockCamera(false);
    this.startPoint = this.endPoint = null;
  }

  if (this.input.mouseUp(0)) {
    this.onMouseUp();
  }

  if (!!this.startPoint && !!this.endPoint) {
    var distance = this.startPoint.distanceTo(this.endPoint);
    if (distance > 0) {
      this.updateSelectionBox();
    }
  }

  this.updateSelection();
};

SelectTool.prototype.updateSelectionBox = function() {
  var left = this.startPoint.x < this.endPoint.x ? this.startPoint.x : this.endPoint.x;
  var top = this.startPoint.y < this.endPoint.y ? this.startPoint.y : this.endPoint.y;
  var width = Math.abs(this.endPoint.x - this.startPoint.x);
  var height = Math.abs(this.endPoint.y - this.startPoint.y);
  this.selectionRect = [left, top, width, height];

  this.context.beginPath();
  this.context.lineWidth = '1';
  this.context.setLineDash([3]);
  this.context.strokeStyle = '#ffffff';
  this.context.rect(left, top, width, height);

  this.context.stroke();
};

SelectTool.prototype.updateSelection = function() {
  var blocks = this.blocks;

  for (var i = 0; i < this.selections.length; i++) {
    var coord = this.selections[i];
    coord = coord.clone().add(new THREE.Vector3(0.5, 0.5, 0.5));
    coord = blocks.getCoordSubOffset(coord);
    var localPoint = blocks.coordToPoint(coord);
    var worldPoint = blocks.obj.localToWorld(localPoint);
    var vector = worldPoint.project(this.camera);
    vector.x = Math.round((vector.x + 1) * canvas.width / 2);
    vector.y = Math.round((-vector.y + 1) * canvas.height / 2);

    this.context.fillStyle = '#ffffff';
    this.context.fillRect(vector.x, vector.y, 1, 1);
  }
};

SelectTool.prototype.onMouseUp = function() {
  var blocks = this.blocks;
  var camera = this.camera;
  var canvas = this.canvas;
  var self = this;

  var screenPoints = [];
  this.blocks.visit(function(i, j, k, b) {
    var coord = new THREE.Vector3(i + 0.5, j + 0.5, k + 0.5);
    coord = blocks.getCoordSubOffset(coord);
    var localPoint = blocks.coordToPoint(coord);
    var worldPoint = blocks.obj.localToWorld(localPoint);
    var vector = worldPoint.project(camera);
    vector.x = Math.round((vector.x + 1) * canvas.width / 2);
    vector.y = Math.round((-vector.y + 1) * canvas.height / 2);

    screenPoints.push({
      screen: vector,
      coord: new THREE.Vector3(i, j, k)
    });
  });

  this.selections = [];
  for (var i = 0; i < screenPoints.length; i++) {
    var screen = screenPoints[i].screen;
    var coord = screenPoints[i].coord;
    if (screen.x > this.selectionRect[0] && screen.x < this.selectionRect[0] + this.selectionRect[2] &&
      screen.y > this.selectionRect[1] && screen.y < this.selectionRect[1] + this.selectionRect[3]) {
      this.selections.push(coord);
    }
  }

  this.editor.selections = this.selections;
};

module.exports = SelectTool;