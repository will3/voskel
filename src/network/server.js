var winston = require('winston');
var jsondiffpatch = require('jsondiffpatch');
var CBuffer = require('cbuffer');

module.exports = function(port, opts) {
  "use strict";

  opts = opts || {};
  var sentBufferLength = opts.sentBufferLength || 100;
  var state = null;
  var clientMap = {};

  var io = require('socket.io')();

  io.on('connection', function(socket) {
    winston.log('info', 'a user connected');

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

    clientMap[socket.id] = client;

    socket.on('state-ack', function(data) {
      client.lastAck = data;
    });
  });

  io.on('disconnect', function(socket) {
    winston.log('info', 'a user disconnected');
    delete clientMap[socket.id];
  });

  var server = io.listen(port);
  winston.log('info', 'started on port: ' + port);

  function tick() {
    for (var id in clientMap) {
      var client = clientMap[id];
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

  return {
    io: io,
    tick: tick,
    get clients() {
      var clients = [];
      for (var id in clientMap) {
        clients.push(clientMap[id]);
      }
      return clients;
    },
    get state() {
      return state;
    },
    set state(value) {
      state = value;
    },
    on: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      io.on.apply(io, args);
    }
  };
};