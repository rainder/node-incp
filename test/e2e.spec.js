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

  it('should ignore different groups1', function *() {
    const incp1 = new INCP({
      type: 'one',
      group: 'house'
    });
    const incp2 = new INCP({
      type: 'two',
      group: 'car'
    });

    yield incp1.start();
    yield incp2.start();

    try {
      yield incp1.connectTo({
        host: incp2.server.host,
        port: incp2.server.port
      });
      false.should.equals(true);
    } catch (e) {
      e.errno.should.equals(4)
    }

    yield cb => setTimeout(cb, 100);
    incp1.nodes.size.should.equals(0);
    incp2.nodes.size.should.equals(0);
  });

  it('should ignore different groups2', function *() {
    const incp1 = new INCP({
      type: 'one'
    });
    const incp2 = new INCP({
      type: 'two',
      group: 'car'
    });

    yield incp1.start();
    yield incp2.start();

    try {
      yield incp1.connectTo({
        host: incp2.server.host,
        port: incp2.server.port
      });
      false.should.equals(true);
    } catch (e) {
      e.errno.should.equals(4)
    }

    yield cb => setTimeout(cb, 100);
    incp1.nodes.size.should.equals(0);
    incp2.nodes.size.should.equals(0);
  });

  it('should ignore different groups3', function *() {
    const incp1 = new INCP({
      type: 'one',
      group: 'car'
    });
    const incp2 = new INCP({
      type: 'two'
    });

    yield incp1.start();
    yield incp2.start();

    try {
      yield incp1.connectTo({
        host: incp2.server.host,
        port: incp2.server.port
      });
      false.should.equals(true);
    } catch (e) {
      e.errno.should.equals(4)
    }

    yield cb => setTimeout(cb, 100);
    incp1.nodes.size.should.equals(0);
    incp2.nodes.size.should.equals(0);
  });

  it('should set a flag on a node', function *() {
    const incp1 = new INCP({
      type: 'one'
    });
    const incp2 = new INCP({
      type: 'two',
      flags: {
        test: 4
      }
    });

    yield incp1.start();
    yield incp2.start();

    yield incp1.connectTo({
      host: incp2.server.host,
      port: incp2.server.port
    });

    yield incp1.flag('state', 'quiting');

    yield cb => setTimeout(cb, 100);
    incp1.nodes.size.should.equals(1);
    incp2.nodes.size.should.equals(1);

    incp1.config.flags.state.should.equals('quiting');
    incp2.nodes.get(incp1.getId()).options.remote.flags.state.should.equals('quiting');

    incp2.config.flags.test.should.equals(4);
    incp1.nodes.get(incp2.getId()).options.remote.flags.test.should.equals(4);
  });
});