var panel = require('./panel');

function clamp(value, min, max) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

module.exports = function(editor) {
  var data = [{
    title: 'name',
    value: '',
    onChange: function(value) {
      editor.getSelectedPrefab().userData.name = value;
    }
  }, {
    title: 'size',
    value: '',
    onFinishEditing: function(value, input) {
      var reg = /^\s*(\d{1,2}) (\d{1,2}) (\d{1,2})\s*$/g
      var matches = reg.exec(value);

      if (matches == null) {
        editor.updatePropertyPanel();
        return;
      }

      editor.updateSize([
        clamp(parseInt(matches[1]), 0, 32),
        clamp(parseInt(matches[2]), 0, 32),
        clamp(parseInt(matches[3]), 0, 32)
      ]);

      editor.updatePropertyPanel();
    }
  }, {
    title: 'mirror',
    type: 'checkList',
    options: ['x', 'y', 'z'],
    onChange: function(options) {
      editor.reflectX = editor.reflectY = editor.reflectZ = false;
      for (var i = 0; i < options.length; i++) {
        if (options[i] === 'x') {
          editor.reflectX = true;
        } else if (options[i] === 'y') {
          editor.reflectY = true;
        } else if (options[i] === 'z') {
          editor.reflectZ = true;
        }
      }
    }
  }];

  var propertyPanel = panel(data, {
    customPlacement: true
  });

  propertyPanel.domElement.style.position = 'absolute';
  propertyPanel.domElement.style.right = 40 + 'px';
  propertyPanel.domElement.style.top = 20 + 'px';
  propertyPanel.domElement.style.width = 200 + 'px';
  document.getElementById('gui').appendChild(propertyPanel.domElement);

  return propertyPanel;
};