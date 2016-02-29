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
      throw err;
    }

    var name = args._[0];

    if (saves[name] == null) {
      throw new Error('cannot find save named: ' + name);
    }

    editor.deserialize(saves[name]);
  };

  devConsole.commands['new'] = function(args) {
    editor.createNew();
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

  devConsole.commands['export'] = function(args) {
    var name = args._[0];
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
      if (saves[name] == null) {
        throw new Error('save not found for name: ' + name);
      }
      window.prompt('copy and paste', JSON.stringify(saves[name]));
    } catch (err) {
      throw err;
    }
  };

  devConsole.commands['reset'] = function(args) {
    if (args.f == null) {
      throw new Error('please reset -f to confirm');
    }

    if (args.f) {
      window.localStorage.setItem('b_saves', '{}');
    }
  };

  devConsole.commands['mirror'] = function(args) {
    if (args._.length === 0) {
      throw new Error('please specify x y z or none');
    }

    if (args._.length === 1) {
      if (args._[0] === 'none') {
        editor.reflectX = editor.reflectY = editor.reflectZ = false;
      }
    }

    editor.reflectX = editor.reflectY = editor.reflectZ = false;
    for (var i = 0; i < args._.length; i++) {
      var arg = args._[i];
      if (arg === 'x') {
        editor.reflectX = true;
      } else if (arg === 'y') {
        editor.reflectY = true;
      } else if (arg === 'z') {
        editor.reflectZ = true;
      } else {
        throw new Error('unknown option: ' + arg);
      }
    }
  };

  devConsole.commands['screen'] = function(args) {
    editor.screenshot();
  };
}