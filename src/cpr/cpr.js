module.exports = function(opts) {
  opts = opts || {};
  var palette = opts.palette || [];
  var onPick = opts.onPick || function() {};
  var blockWidth = opts.blockWidth || 20;
  var blockHeight = opts.blockHeight || 20;

  var container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '20px';
  container.style.bottom = '20px';
  document.body.appendChild(container);

  container.onfocus = function() {
    container.style['outline'] = 'none';
  };

  var blocks = [];

  for (var i = 0; i < palette.length; i++) {
    var row = palette[i];
    for (var j = 0; j < row.length; j++) {
      addColorBlock(i, j, row[j]);
    }
  }

  updateContainer();

  function addColorBlock(row, column, color) {
    var div = document.createElement('div');
    div.style.backgroundColor = color;
    position(div, row, column);
    container.appendChild(div);

    var columns = blocks[row] || (blocks[row] = []);
    columns[column] = div;
  };

  function add(row, column, obj) {
    var identifier;
    var element;

    if (obj.imgData != null) {
      element = document.createElement('img');
      position(element, row, column);
      element.src = obj.imgData;
      container.appendChild(element);

      identifier = obj.identifier;
    }

    if (blocks[row] == null) {
      blocks[row] = [];
    }
    blocks[row][column] = element;

    if (palette[row] == null) {
      palette[row] = [];
    }
    palette[row][column] = identifier;

    updateContainer();
  };

  function position(element, row, column) {
    element.style.position = 'absolute';
    element.style.left = column * blockWidth + 'px';
    element.style.top = row * blockHeight + 'px';
    element.style.width = blockWidth + 'px';
    element.style.height = blockHeight + 'px';
    element.style.display = 'inline-block';
  };

  function getMaxColumns() {
    var max = 0;
    for (var i = 0; i < palette.length; i++) {
      if (palette[i].length > max) {
        max = palette[i].length;
      }
    }

    return max;
  };

  function updateContainer() {
    container.style.width = getMaxColumns() * blockWidth + 'px';
    container.style.height = palette.length * blockHeight + 'px';
  };

  var highlightDiv = null;

  function highlight(row, column) {
    if (highlightDiv == null) {
      highlightDiv = document.createElement('div');
      highlightDiv.style.position = 'absolute';
      highlightDiv.style.width = blockWidth + 'px';
      highlightDiv.style.height = blockHeight + 'px';
      highlightDiv.style.display = 'inline-block';
      highlightDiv.style.border = '1px solid #FFFFFF';
      container.appendChild(highlightDiv);
    }

    highlightDiv.style.left = column * blockWidth - 1 + 'px';
    highlightDiv.style.top = row * blockHeight - 1 + 'px';
  };

  container.addEventListener('mousedown', function(e) {
    var mouseX = e.pageX - container.offsetLeft;
    var mouseY = e.pageY - container.offsetTop;
    var row = Math.floor(mouseY / blockHeight);
    var column = Math.floor(mouseX / blockWidth);

    if (palette[row] == null) {
      return;
    }

    var color = palette[row][column];
    highlight(row, column);
    onPick(color);
  });

  highlight(0, 0);

  return {
    highlight: highlight,
    add: add,
    palette: palette,
    domElement: container
  }
};