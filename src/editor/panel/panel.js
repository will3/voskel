module.exports = function(data) {
  var container = document.createElement('div');

  container.className = 'panel';

  container.style.position = 'absolute';
  container.style.right = 40 + 'px';
  container.style.top = 20 + 'px';
  container.style.width = 200 + 'px';

  var panel = {};
  panel.controllers = {};

  var controllers = {
    'checkList': checkListController
  };

  for (var i = 0; i < data.length; i++) {
    var item = data[i];

    var factory = controllers[item.type] || valueController;
    var controller = factory(item);
    panel.controllers[item.title] = controller;

    container.appendChild(controller.element);
  }

  document.body.appendChild(container);

  return panel;
};

var valueController = function(item) {

  var onChange = item.onChange || function() {};
  var onFinishEditing = item.onFinishEditing || function() {};

  var section = document.createElement('section');
  section.className = 'section';

  var title = document.createElement('div');
  title.innerHTML = item.title;
  title.className = 'title';
  section.appendChild(title);

  var input = document.createElement('input');
  input.type = 'text';
  input.value = item.value;

  section.appendChild(input);

  var inputListener = function() {
    onChange(input.value);
  };

  var keydownListener = function(e) {
    if (e.keyCode === 13) {
      input.blur();
    }
  };

  input.addEventListener('input', inputListener);
  input.addEventListener('keydown', keydownListener);

  function setValue(value) {
    input.value = value;
  };

  function dispose() {
    input.removeEventListener('input', inputListener);
    input.removeEventListener('keydown', keydownListener);
  };

  input.onblur = function() {
    onFinishEditing(input.value, input);
  };

  return {
    element: section,
    setValue: setValue,
    set onChange(value) {
      onChange = value;
    },
    dispose: dispose
  }
};

var checkListController = function(item) {
  var onChange = item.onChange || function() {};

  var section = document.createElement('section');
  section.className = 'section';

  var title = document.createElement('div');
  title.innerHTML = item.title;
  title.className = 'title';
  section.appendChild(title);

  var options = item.options;

  var buttons = [];

  var onClick = function(index) {
    return function() {
      var button = buttons[index];
      if (button.className === 'selected') {
        button.className = '';
      } else {
        button.className = 'selected';
      }

      onChange(getSelectedOptions());
    };
  };

  function getSelectedOptions() {
    var selection = [];
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].className === 'selected') {
        selection.push(options[i]);
      }
    }

    return selection;
  };

  for (var i = 0; i < options.length; i++) {
    var option = options[i];
    var button = document.createElement('button');
    button.innerHTML = option;
    section.appendChild(button);

    if (i === options.length - 1) {
      button.style['border-right-style'] = '2px solid #000';
    }

    button.onclick = onClick(i);

    buttons.push(button);
  }

  return {
    element: section
  }
};