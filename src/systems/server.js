var jsondiffpatch = require('jsondiffpatch');
var CBuffer = require('cbuffer');

"use strict";
var Server = function(port, opts) {
  opts = opts || {};

  this.port = port;

  this.sentBufferLength = opts.sentBufferLength || 100;

  this.state = null;

  this.clients = {};

  this.io = require('socket.io')();

  this.app = null;
};

Server.prototype.start = function() {
  var io = this.io;
  var clients = this.clients;
  var sentBufferLength = this.sentBufferLength;

  io.on('connection', function(socket) {
    var client = {
      socket: socket,
      ack: 0,
      lastAck: 0,
      sentPackets: new CBuffer(sentBufferLength),
      getLastAckState: function() {
        var self = this;
        this.sentPackets.forEach(function(packet) {
          if (packet.ack === self.lastAck) {
            return packet.state;
          }
        });

        return null;
      }
    };

    clients[socket.id] = client;

    socket.on('state-ack', function(data) {
      client.lastAck = data;
    });

    socket.on('serverFunc', function(data) {
      for (var id in data) {
        var rpcs = data[id];
        for (var i = 0; i < rpcs.length; i++) {
          var rpc = rpcs[i];
          var object = this.app.getById(id);
          object[rpc.func].call(object, rpc.args);
        }
      }
    });
  });

  io.on('disconnect', function(socket) {
    delete clients[socket.id];
  });

  var server = io.listen(this.port);
};

Server.prototype.tick = function() {
  var io = this.io;
  var clients = this.clients;
  var state = this.state;

  for (var id in clients) {
    var client = clients[id];
    var socket = client.socket;

    var lastAckState = client.getLastAckState();

    var diff = jsondiffpatch.diff(lastAckState, state);

    var packet = {
      state: diff,
      ack: client.ack
    };

    // Increment ack
    client.ack++;

    // TODO emit diff from last ack state
    socket.emit('state', packet);

    // Record sent packets
    client.sentPackets.push(packet);
  }
};

Server.prototype.on = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  this.io.on.apply(this.io, args);
};

Server.prototype.getClients = function() {
  var clients = [];
  for (var id in this.clients) {
    clients.push(this.clients[id]);
  }
  return clients;
};

module.exports = function(port, opts) {
  var server = new Server(port, opts);
  server.start();
  return server;
};