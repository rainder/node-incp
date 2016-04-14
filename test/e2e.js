'use strict';

require('co-mocha');

const chai = require('chai');
const q = require('q');
const net = require('net');

const IC = require('./..');
const utils = require('./../lib/utils');
const debug = require('debug');

debug.useColors = () => true;
debug.log = console.log.bind(console);

chai.should();

describe('e2e', function () {
  this.timeout(2000);

  function *getNumberOfConnections(ics) {
    yield cb => setTimeout(cb, 500);
    return yield ics.map(ic => cb => ic.server.getServer().getConnections(cb));
  }

  function *createConnection(port, host, cb) {
    const connection = net.Socket();
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

    function CustomError(message) {
      this.message = message;
    }

    ic.setMessageHandler(function *(data) {
      throw new CustomError('123');
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

    const connectionDFD = q.defer();

    server2.on('connection', function (socket) {
      socket.setEncoding('utf-8');
      connectionDFD.resolve();

      socket.on('data', (data) => {
        const json = JSON.parse(data);

        if (json.method === 'introduce') {
          connection.send({
            id: json.id,
            type: 'response',
            success: true,
            data: {}
          });
        }
        if (json.method === 'handshake') {
          serverRequestDFD.resolve(json);
        }

      });
    });

    connection.send({
      id: '1',
      type: 'request',
      method: 'handshake',
      data: { host: '127.0.0.1', port: PORT2 }
    });

    yield connectionDFD.promise;

    const serverRequest = yield serverRequestDFD.promise;
    serverRequest.type.should.equals('request')
    serverRequest.method.should.equals('handshake');

    connection.send({
      id: serverRequest.id,
      type: 'response',
      success: true,
      data: {
        type: 'poipoi'
      }
    });

    const response = yield responseDFD.promise;
    response.success.should.equals(true);
    response.data.type.should.equals('none');

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
    yield ics[0].connectTo('127.0.0.1', 50007);

    ics[0].nodes.size.should.equals(1);
    ics[1].nodes.size.should.equals(1);

    Array.from(ics[0].nodes.values())[0].info.type.should.equals('none');
    Array.from(ics[1].nodes.values())[0].info.type.should.equals('none');
    (!!Array.from(ics[0].nodes.values())[0].getRuntimeId()).should.equals(true);
  });

  it('should use public method send()', function *() {
    const ics = [
      new IC({
        name: 'node1',
        type: 'master',
        host: '127.0.0.1',
        port: 50008
      }),
      new IC({
        name: 'node2',
        type: 'slave',
        host: '127.0.0.1',
        port: 50009
      })
    ];

    ics[0].setMessageHandler(function *(data) {
      console.log('ic0', data);
    });

    ics[1].setMessageHandler(function *(data) {
      data.should.have.keys(['poi']);
      return { response: 123 };
    });

    yield ics.map(ic => ic.startServer());
    yield ics[0].connectTo('127.0.0.1', 50009);

    const nodes = ics[0].getNodes();
    nodes.length.should.equals(1);

    nodes[0].info.type.should.equals('slave');
    const response = yield nodes[0].send({ poi: 1 });
    response.should.have.keys(['response']);

    ics[0].getNodesByType('slave').size.should.equals(1);
    ics[1].getNodesByType('master').size.should.equals(1);
    ics[1].getNodesByType('slave').size.should.equals(0);

    (yield getNumberOfConnections(ics)).should.deep.equals([1, 1]);
  });

  it('should suggest known nodes', function *() {
    const ics = [
      new IC({
        name: 'node1',
        type: 'master',
        host: '127.0.0.1',
        port: 50010
      }),
      new IC({
        name: 'node2',
        type: 'master',
        host: '127.0.0.1',
        port: 50011
      }),
      new IC({
        name: 'node3',
        type: 'master',
        host: '127.0.0.1',
        port: 50012
      })
    ];

    yield ics.map(ic => ic.startServer());

    yield ics[0].connectTo('127.0.0.1', 50011);
    yield ics[2].connectTo('127.0.0.1', 50011);

    {
      const nodes = ics[0].getNodes();
      nodes.length.should.equals(2);
      nodes.map(item => item.info.runtime_id).sort().should.deep.equals([
        ics[1].getRuntimeId(),
        ics[2].getRuntimeId()
      ].sort());
    }

    {
      const nodes = ics[1].getNodes();
      nodes.length.should.equals(2);
      nodes.map(item => item.info.runtime_id).sort().should.deep.equals([
        ics[0].getRuntimeId(),
        ics[2].getRuntimeId()
      ].sort());
    }

    {
      const nodes = ics[2].getNodes();
      nodes.length.should.equals(2);
      nodes.map(item => item.info.runtime_id).sort().should.deep.equals([
        ics[0].getRuntimeId(),
        ics[1].getRuntimeId()
      ].sort());
    }

    (yield getNumberOfConnections(ics)).should.deep.equals([2, 2, 2]);
  });

  it('should suggest known nodes and broadcast message', function *() {
    const ics = [
      new IC({
        name: 'node1',
        type: 'master',
        host: '127.0.0.1',
        port: 50020
      }),
      new IC({
        name: 'node2',
        type: 'master',
        host: '127.0.0.1',
        port: 50021
      }),
      new IC({
        name: 'node3',
        type: 'master',
        host: '127.0.0.1',
        port: 50022
      })
    ];

    yield ics.map(ic => ic.startServer());

    yield ics[0].connectTo('127.0.0.1', 50021);
    yield ics[1].connectTo('127.0.0.1', 50020);
    yield ics[2].connectTo('127.0.0.1', 50020);

    ics[1].setMessageHandler(function *() {
      return { 'ok': 1 }
    });

    ics[2].setMessageHandler(function *() {
      return { 'ok': 2 }
    });

    {
      const nodes = ics[0].getNodes();
      nodes.length.should.equals(2);
      nodes.map(item => item.info.runtime_id).sort().should.deep.equals([
        ics[1].getRuntimeId(),
        ics[2].getRuntimeId()
      ].sort());
    }

    {
      const nodes = ics[1].getNodes();
      nodes.length.should.equals(2);
      nodes.map(item => item.info.runtime_id).sort().should.deep.equals([
        ics[0].getRuntimeId(),
        ics[2].getRuntimeId()
      ].sort());
    }

    {
      const nodes = ics[2].getNodes();
      nodes.length.should.equals(2);
      nodes.map(item => item.info.runtime_id).sort().should.deep.equals([
        ics[0].getRuntimeId(),
        ics[1].getRuntimeId()
      ].sort());
    }

    for (let node of ics[0].getNodes()) {
      const response = yield node.send({ test: 1 });
      //console.log(response);
    }

    (yield getNumberOfConnections(ics)).should.deep.equals([2, 2, 2]);
  });

  it('should shutdown an instance', function *() {
    const ics = [
      new IC({
        name: 'node1',
        type: 'master',
        host: '127.0.0.1',
        port: 50030
      }),
      new IC({
        name: 'node2',
        type: 'master',
        host: '127.0.0.1',
        port: 50031
      })
    ];

    yield ics.map(ic => ic.startServer());

    yield ics[0].connectTo('127.0.0.1', 50031);
    yield ics[1].connectTo('127.0.0.1', 50030);

    ics[0].nodes.size.should.equals(1);
    ics[1].nodes.size.should.equals(1);

    yield ics[1].shutdown();

    ics[0].nodes.size.should.equals(0);
    ics[1].nodes.size.should.equals(0);
  });

  it('should shutdown both instance', function *() {
    const ics = [
      new IC({
        name: 'node1',
        type: 'master',
        host: '127.0.0.1',
        port: 50040
      }),
      new IC({
        name: 'node2',
        type: 'master',
        host: '127.0.0.1',
        port: 50041
      }),
      new IC({
        name: 'node2',
        type: 'master',
        host: '127.0.0.1',
        port: 50042
      })
    ];

    yield ics.map(ic => ic.startServer());

    yield ics[0].connectTo('127.0.0.1', 50041);
    yield ics[1].connectTo('127.0.0.1', 50040);
    yield ics[2].connectTo('127.0.0.1', 50040);

    ics[0].nodes.size.should.equals(2);
    ics[1].nodes.size.should.equals(2);
    ics[2].nodes.size.should.equals(2);

    (yield getNumberOfConnections(ics)).should.deep.equals([2, 2, 2]);

    for (let i = 0; i < 2; i++) {
      ics[i].nodesByType.map.size.should.equals(1);
      ics[i].nodesByType.map.get('master').size.should.equals(2);
    }

    yield [
      ics[0].shutdown(),
      ics[1].shutdown()
    ];

    ics[0].nodes.size.should.equals(0);
    ics[1].nodes.size.should.equals(0);
    ics[2].nodes.size.should.equals(0);

    (yield getNumberOfConnections(ics)).should.deep.equals([0, 0, 0]);
  });

});