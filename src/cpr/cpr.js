module.exports = function(opts) {
  opts = opts || {};
  var columns = opts.columns || 4;
  var palette = opts.palette || [];

  var container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '20px';
  container.style.bottom = '20px';
  document.body.appendChild(container);

  for (var i = 0; i < palette.length; i++) {
    addColorBlock(i, palette[i]);
  }
  updateContainer();

  function addColorBlock(index, color) {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = getColumn(index) * 20 + 'px';
    div.style.top = getRow(index) * 20 + 'px';
    div.style.width = '20px';
    div.style.height = '20px';
    div.style.backgroundColor = color;
    div.style.display = 'inline-block';
    container.appendChild(div);
  };

  function updateContainer() {
    container.style.width = columns * 20 + 'px';
    container.style.height = Math.ceil(palette.length / columns) * 20 + 'px';
  };

  function getRow(index) {
    return Math.floor(index / columns);
  };

  function getColumn(index) {
    return index % columns;
  };

  return container;
};