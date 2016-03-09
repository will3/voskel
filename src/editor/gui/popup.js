module.exports = {
  prompt: function(opts, callback) {
    var text = opts.text;
    var buttons = opts.buttons || ['OK'];
    var containerWidth = opts.containerWidth || 200;
    var containerHeight = opts.containerHeight || 200;

    var background = document.createElement('div');
    background.style.backgroundColor = 'rgba(0,0,0,0.8)'
    background.style.position = 'absolute';
    background.style.width = '100%';
    background.style.height = '100%';
    document.body.appendChild(background);

    containerWidth = 200;
    containerHeight = 200;
    var container = document.createElement('div');
    container.className = 'prompt';
    container.style.position = 'absolute';
    container.style.width = containerWidth + 'px';
    // container.style.height = containerHeight + 'px';

    background.appendChild(container);

    updateLayout();

    function onWindowResize() {
      updateLayout();
    };

    window.addEventListener('resize', onWindowResize);

    var question = document.createElement('h2');
    question.innerHTML = text;
    question.style.fontFamily = ''
    container.appendChild(question);

    // var input = document.createElement('input');
    // input.type = 'text';
    // container.appendChild(input);

    // container.appendChild(document.createElement('br'));

    // input.focus();

    function onClick(index) {
      return function() {
        var shouldDismiss = callback(index);
        if (shouldDismiss === undefined) {
          shouldDismiss = true;
        }

        if (shouldDismiss) {
          dismiss();
        }
      }
    };

    for (var i = 0; i < buttons.length; i++) {
      var buttonText = buttons[i];
      var button = document.createElement('button');
      button.innerHTML = buttonText;
      button.onclick = onClick(i);
      container.appendChild(button);
    }

    function updateLayout() {
      container.style.left = (window.innerWidth - containerWidth) / 2 + 'px';
      container.style.top = (window.innerHeight - containerHeight) / 2 + 'px';
    };

    function dismiss() {
      document.body.removeChild(background);
      window.removeEventListener('resize', onWindowResize);
    }

    var prompt = {
      dismiss: dismiss
    };

    return prompt;
  }
}