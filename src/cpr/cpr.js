module.exports = function(opts) {
  opts = opts || {};
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
    var row = palette[i];
    for (var j = 0; j < row.length; j++) {
      addColorBlock(i, j, row[j]);
    }
  }

  updateContainer();

  function addColorBlock(row, column, color) {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = column * blockWidth + 'px';
    div.style.top = row * blockHeight + 'px';
    div.style.width = blockWidth + 'px';
    div.style.height = blockHeight + 'px';
    div.style.backgroundColor = color;
    div.style.display = 'inline-block';
    container.appendChild(div);

    var columns = blocks[row] || (blocks[row] = []);
    columns[column] = div;
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
    highlight: highlight
  }
};