var Editor = require('./editor');

module.exports = function(editor, devConsole) {

  devConsole.commands['size'] = function(args) {
    var defaultSize = editor.config['editor_default_size'];
    var x = args._[0] || defaultSize[0];
    var y = args._[1] || args._[0] || defaultSize[1];
    var z = args._[2] || args._[0] || defaultSize[2];

    editor.updateSize([x, y, z]);
  };

  devConsole.commands['offset'] = function(args) {
    var x = args._[0] || 0;
    var y = args._[1] || 0;
    var z = args._[2] || 0;

    editor.blocks.setOffset(new THREE.Vector3(x, y, z));
  };

  devConsole.commands['save'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      window.localStorage.setItem('b_saves', {});
      throw err;
    }

    var name = args._[0];

    if (name.length === 0) {
      throw new Error('Usage: save [name]');
    }

    saves[name] = editor.serialize();

    window.localStorage.setItem('b_saves', JSON.stringify(saves));
  };

  devConsole.commands['delete'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      window.localStorage.setItem('b_saves', {});
      throw err;
    }

    var name = args._[0];

    if (name.length === 0) {
      throw new Error('Usage: delete [name]');
    }
    delete saves[name];

    window.localStorage.setItem('b_saves', JSON.stringify(saves));
  };

  devConsole.commands['load'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      window.localStorage.setItem('b_saves', {});
      throw err;
    }

    var name = args._[0];

    editor.deserialize(saves[name]);
  };

  devConsole.commands['new'] = function(args) {
    editor.blocks.clear();
    editor.updateSize(editor.config['editor_default_size']);
  };

  devConsole.commands['frame'] = function(args) {
    var subCommand = args._[0];

    if (subCommand === 'add') {
      editor.addFrame();
    } else if (subCommand === 'next') {
      editor.nextFrame();
    } else if (subCommand === 'last') {
      editor.lastFrame();
    } else {
      throw new Error('Usage: frame [add|next|last]');
    }
  };

  devConsole.commands['tool'] = function(args) {
    if (editor.toolName !== args._[0]) {
      editor.toolName = args._[0];
      editor.updateTool();
    }
  };

  devConsole.commands['play'] = function(args) {
    var frameRate = args._[0] || 4;

    editor.frameRate = frameRate;
    editor.play();
  };

  devConsole.commands['stop'] = function(args) {
    editor.stop();
  };

  devConsole.commands['set'] = function(args) {
    var key = args._[0];
    var value = args._[1];

    if (editor[key] === undefined) {
      throw new Error('key not found: ' + key);
    }

    editor[key] = value;
  };
}