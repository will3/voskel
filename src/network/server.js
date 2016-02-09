var winston = require('winston');
var jsondiffpatch = require('jsondiffpatch');

module.exports = function(port) {
  "use strict";

  port = port || 3000;
  var state = null;
  var clients = {};

  var io = require('socket.io')();

  io.on('connection', function(socket) {
    winston.log('info', 'a user connected');
    clients[socket.id] = {
      socket: socket,
      ack: 0,
      lastAck: 0,
      sentPackets: [],
      getLastAckState: function() {
        for (var i = 0; i < this.sentPackets.length; i++) {
          var packet = this.sentPackets[i];
          if (packet.ack === lastAck) {
            return packet.state;
          }
        }
        return null;
      }
    };

    socket.on('state-ack', function(data) {
      client.lastAck = data;
    });
  });

  io.on('disconnect', function(socket) {
    winston.log('info', 'a user disconnected');
    delete clients[socket.id];
  });

  var server = io.listen(port);
  winston.log('info', 'started on port: ' + port);

  function tick() {
    for (var id in clients) {
      var client = clients[id];
      var socket = client.socket;

      var lastAckState = client.getLastAckState();

      var packet = {
        state: state,
        ack: client.ack
      };

      client.ack++;

      // TODO emit diff from last ack state
      socket.emit('state', packet);

      client.sentPackets.push(packet);

      // TODO use cbuffer
      if (client.sentPackets.length > 200) {
        client.sentPackets.pop();
      }
    }
  };

  return {
    io: io,
    tick: tick,
    get state() {
      return state;
    },
    set state(value) {
      state = value;
    }
  };
};