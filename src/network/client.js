var io = require('socket.io-client');
var winston = require('winston');
var jsondiffpatch = require('jsondiffpatch');

module.exports = function(host) {
  "use strict";

  host = host || 'http://localhost:3000';
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
    }
  };
};