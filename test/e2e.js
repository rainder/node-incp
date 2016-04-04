'use strict';

require('co-mocha');

const chai = require('chai');
const q = require('q');
const net = require('net');

const IC = require('./..');
const utils = require('./../lib/utils');

chai.should();

describe('e2e', function () {
  this.timeout(2000);

  function *createConnection(port, host, cb) {
    const connection = net.createConnection();
    connection.connect(port, host);
    yield cb => connection.on('connect', cb);

    connection
      .setEncoding('utf-8')
      .on('data', data => {
        cb(JSON.parse(data));
      });

    return {
      send: data => connection.write(JSON.stringify(data) + '\n')
    };
  }

  it('should start a server', function *() {
    const ic = new IC({
      name: 'test',
      type: 'none',
      host: '0.0.0.0',
      port: 50001
    });

    yield ic.startServer();
  });

  it('should send a message', function *() {
    const PORT = 50002;

    const ic = new IC({
      name: 'test',
      type: 'none',
      host: '0.0.0.0',
      port: PORT
    });

    yield ic.startServer();

    const responseDFD = q.defer();
    const connection = yield createConnection(PORT, '127.0.0.1', function (data) {
      responseDFD.resolve(data);
    });

    ic.setMessageHandler(function *(data) {
      return { 'response': true }
    });

    connection.send({
      id: '1',
      type: 'request',
      method: 'external',
      data: { a: 4 }
    });

    const response = yield responseDFD.promise;
    response.success.should.equals(true);
  });

  it('should send an error message', function *() {
    const PORT = 50003;
    const ic = new IC({
      name: 'test',
      type: 'none',
      host: '0.0.0.0',
      port: PORT
    });

    yield ic.startServer();

    const responseDFD = q.defer();
    const connection = yield createConnection(PORT, '127.0.0.1', function (data) {
      responseDFD.resolve(data);
    });

    ic.setMessageHandler(function *(data) {
      throw new TypeError('123');
    });

    connection.send({
      id: '1',
      type: 'request',
      method: 'external',
      data: { b: 4 }
    });

    const response = yield responseDFD.promise;
    response.success.should.equals(false);
    response.data.message.should.equals('123');
  });

  it('should send register a new node and connect to it', function *() {
    const PORT = 50004;
    const PORT2 = 50005;

    const ic = new IC({
      name: 'test',
      type: 'none',
      host: '0.0.0.0',
      port: PORT
    });

    yield ic.startServer();

    const responseDFD = q.defer();
    const serverRequestDFD = q.defer();

    const connection = yield createConnection(PORT, '127.0.0.1', function (data) {
      responseDFD.resolve(data);
    });

    const server2 = net.Server();
    server2.listen({
      host: '0.0.0.0',
      port: PORT2
    });

    yield cb => server2.once('listening', () => cb());

    const dfd = q.defer();

    server2.on('connection', function (connection) {
      dfd.resolve();

      connection.on('data', (data) => {
        serverRequestDFD.resolve(JSON.parse(data));
      });
    });

    connection.send({
      id: '1',
      type: 'request',
      method: 'handshake',
      data: { host: '127.0.0.1', port: PORT2, info: { type: 'poipoi' } }
    });

    const response = yield responseDFD.promise;
    response.success.should.equals(true);
    response.data.new.should.equals(true);

    yield dfd.promise;

    const serverRequest = yield serverRequestDFD.promise;
    serverRequest.type.should.equals('request')
    serverRequest.method.should.equals('handshake');

    ic.nodes.size.should.equals(1);
    ic.nodes.get(`127.0.0.1:${PORT2}`).info.type.should.equals('poipoi');
  });

  it('should connect two nodes', function *() {
    const ics = [
      new IC({
        name: 'node1',
        type: 'none',
        host: '127.0.0.1',
        port: 50006
      }),
      new IC({
        name: 'node2',
        type: 'none',
        host: '127.0.0.1',
        port: 50007
      })
    ];

    yield ics.map(ic => ic.startServer());

    //console.log(ics);

    yield ics[0].connectTo('127.0.0.1', 50007);

    //yield cb => setTimeout(cb, 200);

    ics[0].nodes.size.should.equals(1);
    ics[1].nodes.size.should.equals(1);

    Array.from(ics[0].nodes.values())[0].info.type.should.equals('none');
    Array.from(ics[1].nodes.values())[0].info.type.should.equals('none');

    //console.log(ics[0].nodes);
    //console.log(ics[1].nodes);
  });

});