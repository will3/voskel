var io = require('socket.io-client');
var jsondiffpatch = require('jsondiffpatch');

"use strict";

var Client = function(arg) {
  var host = arg;
  if (typeof arg === 'number') {
    host = 'http://localhost:' + arg;
  }

  this.host = host;

  this.socket = io(host);

  this.state = null;

  this.app = null;
};

Client.prototype.start = function() {
  var socket = this.socket;
  var self = this;

  socket.on('state', function(packet) {
    var ack = packet.ack;

    jsondiffpatch.patch(self.state, packet.state);

    socket.emit('state-ack', ack);
  });
};

Client.prototype.on = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  this.socket.on.apply(this.socket, args);
};

module.exports = function(arg) {
  var client = new Client(arg);
  client.start();
  return client;
};