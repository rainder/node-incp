'use strict';

require('co-mocha');

const chai = require('chai');
const q = require('q');
const net = require('net');

const Server = require('./../lib/server');
const dataHandler = require('./../lib/data-handler');

chai.should();

describe('Server 2', function () {
  let server;
  let socket;
  let memory = {};

  it('should listen', function *() {
    server = new Server('test1', '0.0.0.0', '7789');
    yield server.listen();
  });

  it('should connect', function *() {
    socket = new net.Socket();
    socket.connect('7789', '127.0.0.1');
  });

  it('should get message', function *() {
    let dfd = q.defer();

    server.once('message', function (message, socket) {
      dfd.resolve({ socket, message });
    });

    socket.write('{"a": 4}');

    let r = yield dfd.promise;
    r.message.a.should.equal(4);
    memory.socket = r.socket;
  });

  it('should send to the client', function *() {
    let dfd = q.defer();
    yield dataHandler.outcoming(memory.socket, { a: 7 });

    socket.once('data', function (data) {
      dfd.resolve(data.toString());
    });

    let a = yield dfd.promise;
    a.should.equal(`{"a":7}\n`);
  });

  it('should close the server', function *() {
    let dfd = q.defer();

    socket.once('close', dfd.resolve);

    yield server.destroy();
    yield dfd.promise;
  });
});