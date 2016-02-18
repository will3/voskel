module.exports = function(opts) {
  opts = opts || {};
  var columns = opts.columns || 4;
  var palette = opts.palette || [];
  var onPick = opts.onPick || function() {};
  var blockWidth = 20;
  var blockHeight = 20;

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
    addColorBlock(i, palette[i]);
  }
  updateContainer();

  function addColorBlock(index, color) {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = getColumn(index) * blockWidth + 'px';
    div.style.top = getRow(index) * blockHeight + 'px';
    div.style.width = blockWidth + 'px';
    div.style.height = blockHeight + 'px';
    div.style.backgroundColor = color;
    div.style.display = 'inline-block';
    container.appendChild(div);
    blocks[index] = div;
  };

  function updateContainer() {
    container.style.width = columns * blockWidth + 'px';
    container.style.height = Math.ceil(palette.length / columns) * blockHeight + 'px';
  };

  function getRow(index) {
    return Math.floor(index / columns);
  };

  function getColumn(index) {
    return index % columns;
  };

  function getIndex(row, column) {
    return row * columns + column;
  };

  var highlightDiv = null;

  function highlight(index) {
    if (highlightDiv == null) {
      highlightDiv = document.createElement('div');
      highlightDiv.style.position = 'absolute';
      highlightDiv.style.width = blockWidth + 'px';
      highlightDiv.style.height = blockHeight + 'px';
      highlightDiv.style.display = 'inline-block';
      highlightDiv.style.border = '1px solid #FFFFFF';
      container.appendChild(highlightDiv);
    }

    highlightDiv.style.left = getColumn(index) * blockWidth - 1 + 'px';
    highlightDiv.style.top = getRow(index) * blockHeight - 1 + 'px';
  };

  container.addEventListener('mousedown', function(e) {
    var mouseX = e.pageX - container.offsetLeft;
    var mouseY = e.pageY - container.offsetTop;
    var row = Math.floor(mouseY / blockHeight);
    var column = Math.floor(mouseX / blockWidth);
    var index = getIndex(row, column);

    if (index >= palette.length) {
      return;
    }

    var color = palette[index];
    highlight(index);

    onPick(color, index);
  });

  highlight(0);

  return {
    highlight: highlight
  }
};