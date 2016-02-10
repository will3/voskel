var startServer = require('../systems/server');
var startClient = require('../systems/client');
var expect = require('chai').expect;
var jsondiffpatch = require('jsondiffpatch');

// Generates a free port
var counter = 55100;

function getPort() {
  counter++;
  return counter;
};

describe('Channel', function() {
  describe('Server', function() {
    it('should send state', function(done) {
      var port = getPort();
      var server = startServer(port);
      var client = startClient(port);

      server.state = 'foo';

      // Server tick should send state to all connected clients
      client.on('connect', function() {
        server.tick();
      });

      // Verify client receive state
      client.on('state', function(value) {
        var state = jsondiffpatch.patch(null, value.state);
        expect(state).to.equal('foo');
        done();
      });
    });

    it('should return connected clients', function(done) {
      var port = getPort();
      var server = startServer(port);
      var client = startClient(port);

      client.on('connect', function() {
        expect(server.getClients()).to.have.length(1);
        done();
      });
    });

    it('keep buffer of sent states', function() {
      var port = getPort();
      var server = startServer(port);
      var client = startClient(port);

      client.on('connect', function() {
        server.tick();
        server.tick();

        var serverClient = server.clients[0];
        expect(serverClient.sentPackets).to.have.length(2);
      });
    });

    it('keep buffer of sent states according to opts sentBufferLength', function() {
      var port = getPort();
      var server = startServer(port, {
        sentBufferLength: 1
      });
      var client = startClient(port);

      client.on('connect', function() {
        server.tick();
        server.tick();

        var serverClient = server.getClients()[0];
        expect(serverClient.sentPackets).to.have.length(1);
      });
    });
  });

  describe('Client', function() {
    it('should connect', function(done) {
      var port = getPort();
      var server = startServer(port);
      startClient(port);

      server.on('connection', function(socket) {
        done();
      });
    });

    it('client should ack state', function(done) {
      var port = getPort();
      var server = startServer(port);
      var client = startClient(port);

      server.on('connection', function(serverSocket) {
        server.tick();
        serverSocket.on('state-ack', function() {
          done();
        });
      });
    });
  });
});