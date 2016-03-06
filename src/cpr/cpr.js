module.exports = function(opts) {
  opts = opts || {};
  var dataToLoad = opts.data || [];
  var onPick = opts.onPick || function() {};
  var onHover = opts.onHover || function() {};
  var onLeave = opts.onLeave || function() {};
  var customPlacement = opts.customPlacement || false;
  var hideHighlight = opts.hideHighlight || false;
  var showTooltip = opts.showTooltip || false;

  var blockWidth = opts.blockWidth || 20;
  var blockHeight = opts.blockHeight || 20;
  var columns = opts.columns || 14;
  var disableHighlight = opts.disableHighlight || false;

  var container = document.createElement('div');

  if (showTooltip) {
    var tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.visibility = 'hidden';
    tooltip.style.width = '200px';
    tooltip.style.backgroundColor = '#666666';
    tooltip.style.color = '#f6f6f6';
    tooltip.style.padding = '5px';
    container.appendChild(tooltip);
  }

  if (!customPlacement) {
    container.style.position = 'absolute';
    container.style.left = '20px';
    container.style.bottom = '20px';
    document.body.appendChild(container);
  }

  container.onfocus = function() {
    container.style['outline'] = 'none';
  };

  var blocks = [];
  var data = [];

  for (var i = 0; i < dataToLoad.length; i++) {
    add(dataToLoad[i]);
  }

  updateContainer();

  function getRow(index) {
    return Math.floor(index / columns);
  };

  function getColumn(index) {
    return index % columns;
  };

  function getRows() {
    return Math.ceil(data.length / columns);
  };

  function getIndex(row, column) {
    return row * columns + column;
  };

  function remove(index) {
    container.removeChild(blocks[index]);
    blocks[index] = undefined;
    data[index] = undefined;
  };

  function set(index, obj) {
    if (data[index] != null) {
      remove(index);
    };

    var row = getRow(index);
    var column = getColumn(index);

    var element;
    if (obj.imgData != null) {
      element = document.createElement('img');
      element.src = obj.imgData;
    } else if (obj.src != null) {
      element = document.createElement('img');
      element.src = obj.src;
    } else {
      var color = obj;
      element = document.createElement('div');
      element.style.backgroundColor = color;
    }

    container.appendChild(element);
    position(element, row, column);

    blocks[index] = element;
    data[index] = obj;

    updateContainer();

    if (selectedIndex == -1) {
      highlight(0);
    }
  };

  function add(obj) {
    var index = blocks.length;
    set(index, obj);
  };

  function position(element, row, column) {
    element.style.position = 'absolute';
    element.style.left = column * blockWidth + 'px';
    element.style.top = row * blockHeight + 'px';
    element.style.width = blockWidth + 'px';
    element.style.height = blockHeight + 'px';
    element.style.display = 'inline-block';
  };

  function updateContainer() {
    var numberOfColumns = data.length > columns ? columns : data.length;
    container.style.width = numberOfColumns * blockWidth + 'px';
    container.style.height = getRows() * blockHeight + 'px';
  };

  var highlightDiv = null;
  var selectedIndex = -1;

  function highlight(index) {
    if (disableHighlight) {
      return;
    }

    selectedIndex = index;
    var row = getRow(index);
    var column = getColumn(index);

    if (!hideHighlight) {
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
    }
  };

  function clear() {
    for (var i = 0; i < data.length; i++) {
      remove(i);
    }

    data = [];
  };

  function isDescendant(parent, child) {
    if (child == null) {
      return false;
    }

    var node = child.parentNode;
    while (node != null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  container.addEventListener('mousedown', function(e) {
    var mouseX = e.pageX - container.offsetLeft;
    var mouseY = e.pageY - container.offsetTop;
    var row = Math.floor(mouseY / blockHeight);
    var column = Math.floor(mouseX / blockWidth);
    var index = getIndex(row, column);

    if (data[index] == null) {
      return;
    }

    var obj = data[index];
    highlight(index);
    onPick(obj, index);
  });

  var mouse = null;
  container.addEventListener('mousemove', function(e) {
    mouse = e;
    var mouseX = e.pageX - container.offsetLeft;
    var mouseY = e.pageY - container.offsetTop;
    var row = Math.floor(mouseY / blockHeight);
    var column = Math.floor(mouseX / blockWidth);
    var index = getIndex(row, column);

    if (data[index] == null) {
      return;
    }

    var obj = data[index];
    onHover(obj, index);

    if (showTooltip && obj.tooltip != null) {
      tooltip.style.visibility = 'visible';
      tooltip.style.left = mouseX + 'px';
      tooltip.style.top = mouseY + 'px';
      if (tooltip.innerHTML !== obj.tooltip) {
        tooltip.innerHTML = obj.tooltip;
      }
    }
  });

  container.addEventListener('mouseleave', function(e) {
    if (!isDescendant(container, e.toElement)) {
      onLeave(e);

      if (showTooltip) {
        tooltip.style.visibility = 'hidden';
      }
    }
  });

  if (data.length > 0) {
    highlight(0);
  }

  return {
    highlight: highlight,
    add: add,
    set: set,
    clear: clear,
    data: data,
    domElement: container,
    get selectedIndex() {
      return selectedIndex;
    },
    get mouse() {
      return mouse;
    },
    get tooltip() {
      return tooltip;
    }
  }
};