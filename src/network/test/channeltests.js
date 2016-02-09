var startServer = require('../server');
var startClient = require('../client');
var expect = require('chai').expect;
var jsondiffpatch = require('jsondiffpatch');

describe('Channel', function() {
  it('should connect', function(done) {
    var io = startServer(55100).io;
    startClient('http://localhost:55100');

    io.on('connection', function(socket) {
      done();
    });
  });

  it('should send state', function(done) {
    var server = startServer(55101);
    var client = startClient('http://localhost:55101');
    var socket = client.socket;

    server.state = 'foo';

    // Server tick should send state to all connected clients
    socket.on('connect', function(socket) {
      server.tick();
    });

    // Verify client receive state
    socket.on('state', function(value) {
      var state = jsondiffpatch.patch(null, value.state);
      expect(state).to.equal('foo');
      done();
    });
  });

  it('client should ack state', function(done) {
    var server = startServer(55102);
    var io = server.io;
    var client = startClient('http://localhost:55102');
    var socket = client.socket;

    io.on('connection', function(serverSocket) {
      server.tick();
      serverSocket.on('state-ack', function() {
      	done();
      });
    });
  });
});