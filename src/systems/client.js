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

  // List of rpcs to send to server
  this._pendingServerFuncs = [];
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

Client.prototype.tick = function() {
  this.socket.emit('serverFunc', this._pendingServerFuncs);
  this._pendingServerFuncs = [];
};

Client.prototype.on = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  this.socket.on.apply(this.socket, args);
};

Client.prototype.runServerfunc = function(id, func, args) {
  var rpc = {
    id: id,
    func: func,
    args: args
  };
  this._pendingServerFuncs.push(rpc);
};

module.exports = function(arg) {
  var client = new Client(arg);
  client.start();
  return client;
};