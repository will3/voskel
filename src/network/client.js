var io = require('socket.io-client');
var winston = require('winston');
var jsondiffpatch = require('jsondiffpatch');

module.exports = function(arg) {
  "use strict";

  var host = arg;
  if (typeof arg === 'number') {
    host = 'http://localhost:' + arg;
  }

  var socket = io(host);

  var state = null;

  socket.on('state', function(packet) {
    var ack = packet.ack;

    jsondiffpatch.patch(state, packet.state);

    socket.emit('state-ack', ack);
  });

  return {
    socket: socket,
    get state() {
      return state;
    },
    set state(value) {
      state = value;
    },
    on: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      socket.on.apply(socket, args);
    }
  };
};