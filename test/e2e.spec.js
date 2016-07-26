'use strict';

require('co-mocha');
const chai = require('chai');
const INCP = require('./../lib/incp');

chai.should();

describe('work just fine', function () {

  // it('should use loopback interface', function *() {
  //   const incp1 = new INCP({
  //     type: 'one'
  //   });
  //
  //   yield incp1.start();
  //
  //   incp1.setMessageHandler((message, socket) => {
  //     return { a: 6 };
  //   });
  //
  //   const response = yield incp1.sendToNode(incp1.id, { test: true });
  //
  //   response.a.should.equals(6);
  // });

  it('should reverse-connect to the node', function *() {
    const incp1 = new INCP({
      type: 'one'
    });
    const incp2 = new INCP({
      type: 'two'
    });

    yield incp1.start();
    yield incp2.start();

    yield incp1.connectTo({
      host: incp2.server.host,
      port: incp2.server.port
    });

    yield cb => setTimeout(cb, 100);

    const serverConnections = yield [
      cb => incp1.server.getServer().getConnections(cb),
      cb => incp2.server.getServer().getConnections(cb)
    ];

    serverConnections.should.deep.equals([1, 1]);
  });

  it('should send a message to the node', function *() {
    const incp1 = new INCP({
      type: 'one'
    });
    const incp2 = new INCP({
      type: 'two'
    });

    yield incp1.start();
    yield incp2.start();

    yield incp1.connectTo({
      host: incp2.server.host,
      port: incp2.server.port
    });

    incp2.setMessageHandler(function *(data) {
      return { ehllo: true };
    });

    const response = yield incp1.sendToNode(incp2.id, {
      hello: true
    });

    response.should.have.keys(['ehllo']);
  });

  it('should ignore same connection to the node', function *() {
    const incp1 = new INCP({
      type: 'one'
    });
    const incp2 = new INCP({
      type: 'two'
    });

    yield incp1.start();
    yield incp2.start();

    yield [
      incp1.connectTo({
        host: incp2.server.host,
        port: incp2.server.port
      }),
      incp1.connectTo({
        host: incp2.server.host,
        port: incp2.server.port
      }),
      incp2.connectTo({
        host: incp1.server.host,
        port: incp1.server.port
      })
    ];

    yield cb => setTimeout(cb, 100);

    const serverConnections = yield [
      cb => incp1.server.getServer().getConnections(cb),
      cb => incp2.server.getServer().getConnections(cb)
    ];

    serverConnections.should.deep.equals([1, 1]);
  });

  it('should suggest the other nodes', function *() {
    const incp1 = new INCP({
      type: 'one'
    });
    const incp2 = new INCP({
      type: 'two'
    });
    const incp3 = new INCP({
      type: 'three'
    });

    yield incp1.start();
    yield incp2.start();
    yield incp3.start();

    yield [
      incp1.connectTo({
        host: incp2.server.host,
        port: incp2.server.port
      }),
      incp2.connectTo({
        host: incp1.server.host,
        port: incp1.server.port
      })
    ];

    yield cb => setTimeout(cb, 100);

    {
      const serverConnections = yield [
        cb => incp1.server.getServer().getConnections(cb),
        cb => incp2.server.getServer().getConnections(cb),
        cb => incp3.server.getServer().getConnections(cb)
      ];

      serverConnections.should.deep.equals([1, 1, 0]);
    }

    yield incp3.connectTo({
      host: incp1.server.host,
      port: incp1.server.port
    });

    yield cb => setTimeout(cb, 100);

    {
      // console.log(incp1.id, incp1.nodes.keys());
      // console.log(incp2.id, incp2.nodes.keys());
      // console.log(incp3.id, incp3.nodes.keys());

      const serverConnections = yield [
        cb => incp1.server.getServer().getConnections(cb),
        cb => incp2.server.getServer().getConnections(cb),
        cb => incp3.server.getServer().getConnections(cb)
      ];

      serverConnections.should.deep.equals([2, 2, 2]);
    }
  });

  it('should shutdown a node', function *() {
    const incp1 = new INCP({
      type: 'one'
    });
    const incp2 = new INCP({
      type: 'two'
    });
    const incp3 = new INCP({
      type: 'three'
    });

    yield incp1.start();
    yield incp2.start();
    yield incp3.start();

    yield [
      incp1.connectTo({
        host: incp2.server.host,
        port: incp2.server.port
      }),
      incp2.connectTo({
        host: incp1.server.host,
        port: incp1.server.port
      }),
      incp3.connectTo({
        host: incp1.server.host,
        port: incp1.server.port
      })
    ];

    yield cb => setTimeout(cb, 100);

    {
      const serverConnections = yield [
        cb => incp1.server.getServer().getConnections(cb),
        cb => incp2.server.getServer().getConnections(cb),
        cb => incp3.server.getServer().getConnections(cb)
      ];

      serverConnections.should.deep.equals([2, 2, 2]);
    }

    yield incp3.shutdown();

    yield cb => setTimeout(cb, 100);

    {
      const serverConnections = yield [
        cb => incp1.server.getServer().getConnections(cb),
        cb => incp2.server.getServer().getConnections(cb),
        cb => incp3.server.getServer().getConnections(cb)
      ];

      serverConnections.should.deep.equals([1, 1, 0]);
    }
  });
});