'use strict';

require('co-mocha');
const { tryCatch } = require('co-try-catch');
const chai = require('chai');
const INCP = require('./../lib/incp');
const INCPError = require('./../lib/incp-error');

chai.should();

describe('work just fine', function () {

  it('should connect to the node', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb)
    ];

    yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    (yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb)
    ]).should.deep.equals([0, 1]);
  });

  it('should return node if connecting to the same node', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb)
    ];

    const node1 = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);
    const node2 = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    node1.should.equals(node2);

    yield cb => setTimeout(cb, 100);

    (yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb)
    ]).should.deep.equals([0, 1]);
  });

  it('should not create 2x duplex connections', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb)
    ];

    yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    (yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb)
    ]).should.deep.equals([0, 1]);

    try {
      yield incp2.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port);
      false.should.equals(true);
    } catch (e) {

    }

    yield cb => setTimeout(cb, 100);

    // console.log(incp1.getNodes());
    // console.log(incp2.getNodes());

    (yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb)
    ]).should.deep.equals([0, 1]);

  });

  it('should not create 2x duplex connections (race condition)', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb)
    ];

    const nodes = yield tryCatch([
      incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
      incp2.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port)
    ]);

    yield cb => setTimeout(cb, 100);

    // console.log(incp1.getNodes());
    // console.log(incp2.getNodes());

    (yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb)
    ]).should.deep.equals([0, 1]);
  });

  it('should respect groups', function *() {
    const incp1 = new INCP({ group: 'one' });
    const incp2 = new INCP({ group: 'two' });

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb)
    ];

    try {
      yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);
    } catch (e) {
      e.errno.should.equals(INCPError.GROUP_MISMATCH.errno());
    }

    yield cb => setTimeout(cb, 100);

    (yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb)
    ]).should.deep.equals([0, 0]);
  });

  it('should introduce relatives', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();
    const incp3 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
      cb => incp3.once('ready', cb),
    ];

    yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);
    yield incp2.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port);

    yield cb => setTimeout(cb, 500);

    Array.from(incp1.getNodes().keys()).should.deep.equals([
      incp2.getId(),
      incp3.getId(),
    ]);

    Array.from(incp2.getNodes().keys()).should.deep.equals([
      incp1.getId(),
      incp3.getId(),
    ]);

    Array.from(incp3.getNodes().keys()).should.deep.equals([
      incp2.getId(),
      incp1.getId(),
    ]);
  });

  it('should send external request', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
    ];

    const node = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    incp2.onRequest = function *(msg) {
      return msg.asd;
    };

    const response = yield node.request({
      asd: 34
    });

    response.should.equals(34);
  });

  it('should spam with messages', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
    ];

    const node = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    incp2.onRequest = function *(msg) {
      return msg.asd + 1;
    };

    const responses = yield Array.from(new Array(32)).map((a, index) => node.request({
      asd: index
    }));

    responses.should.deep.equals(Array.from(new Array(32)).map((_, index) => index + 1));
  });

  it('should destroy client the connection and work just fine', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
    ];

    const node = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    incp2.onRequest = function *(msg) {
      return msg.asd;
    };

    incp2.getNodes().get(incp1.getId()).getSocket().end();
    yield cb => setTimeout(cb, 100);

    const response1 = yield tryCatch(node.request({
      asd: 34
    }));
  });

  it('should send push message', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
    ];

    let msgs = 0;
    incp1.onPush = function *(msg) {
      msgs += msg.a;
      return msg.a + 1;
    };

    yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    const node = incp2.getNodes().get(incp1.getId());

    yield node.push({ a: 5 });
    yield cb => setTimeout(cb, 100);
    msgs.should.equals(5);
  });

  it('should get loopback interface', function *() {
    const incp1 = new INCP();

    yield [
      cb => incp1.once('ready', cb)
    ];

    incp1.onRequest = function *(msg) {
      return msg.a + 1;
    };

    const response = yield incp1.getLoopback().request({ a: 5 });
    response.should.equals(6);
  });

  it('should sent push through loopback interface', function *() {
    const incp1 = new INCP();

    yield [
      cb => incp1.once('ready', cb)
    ];

    let msgs = 0;
    incp1.onPush = function *(msg) {
      msgs += msg.a;
      return msg.a + 1;
    };

    yield incp1.getLoopback().push({ a: 5 });
    yield cb => setTimeout(cb, 100);
    msgs.should.equals(5);
  });

  it('should get loopback interface when connecting to itself', function *() {
    const incp1 = new INCP();

    yield [
      cb => incp1.once('ready', cb)
    ];

    const node = yield incp1.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port);

    node.should.equals(incp1.getLoopback());
  });

  it('should get node if connecting to already connected node', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
    ];

    const node1 = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);
    const node2 = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);

    node1.should.equals(node2);
  });

  it('should set metadata on the node', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP({ metadata: { test: false } });
    const incp3 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
      cb => incp3.once('ready', cb),
    ];

    yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);
    yield incp2.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port);

    yield cb => setTimeout(cb, 100);

    incp1.getNodes().get(incp2.getId()).getMetadata().test.should.equals(false);
    incp3.getNodes().get(incp2.getId()).getMetadata().test.should.equals(false);

    yield incp2.setMetadata('test', true);
    yield cb => setTimeout(cb, 100);

    incp1.getNodes().get(incp2.getId()).getMetadata().test.should.equals(true);
    incp3.getNodes().get(incp2.getId()).getMetadata().test.should.equals(true);
  });

  it('should ok with two instances', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
    ];

    const nodes = yield [[
      incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
    ], [
      incp2.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port)
    ]];

    yield cb => setTimeout(cb, 100);

    const connections = yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb),
    ];

    incp1.getNodes().size.should.equals(1);
    incp2.getNodes().size.should.equals(1);
    // incp3.getNodes().size.should.equals(2);

    function map(nodes) {
      return Array.from(nodes).map(node => {
        return `${node.getId()} ${node.is_client ? 1 : 0}`
      });
    }
  });

  it('should ok with three instances', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();
    const incp3 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
      cb => incp3.once('ready', cb),
    ];

    const nodes = yield [[
      incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
      incp1.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port),
    ], [
      incp2.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
      incp2.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port),
    ], [
      incp3.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
      incp3.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
    ]];

    yield cb => setTimeout(cb, 100);

    const connections = yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb),
      cb => incp3.getServer().getConnections(cb),
    ];

    incp1.getNodes().size.should.equals(2);
    incp2.getNodes().size.should.equals(2);
    incp3.getNodes().size.should.equals(2);
    // incp3.getNodes().size.should.equals(2);

    function map(nodes) {
      return Array.from(nodes).map(node => {
        return `${node.getId()} ${node.is_client ? 1 : 0}`
      });
    }
  });

  it('should ok with four instances', function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();
    const incp3 = new INCP();
    const incp4 = new INCP();

    yield [
      cb => incp1.once('ready', cb),
      cb => incp2.once('ready', cb),
      cb => incp3.once('ready', cb),
      cb => incp4.once('ready', cb),
    ];

    const nodes = yield [[
      incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
      incp1.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port),
      incp1.connectTo(incp4.config.getOptions().host, incp4.config.getOptions().port),
    ], [
      incp2.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
      incp2.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port),
      incp2.connectTo(incp4.config.getOptions().host, incp4.config.getOptions().port),
    ], [
      incp3.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
      incp3.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
      incp3.connectTo(incp4.config.getOptions().host, incp4.config.getOptions().port),
    ], [
      incp4.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
      incp4.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
      incp4.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port),
    ]];

    yield cb => setTimeout(cb, 100);

    const connections = yield [
      cb => incp1.getServer().getConnections(cb),
      cb => incp2.getServer().getConnections(cb),
      cb => incp3.getServer().getConnections(cb),
      cb => incp4.getServer().getConnections(cb),
    ];

    incp1.getNodes().size.should.equals(3);
    incp2.getNodes().size.should.equals(3);
    incp3.getNodes().size.should.equals(3);
    incp4.getNodes().size.should.equals(3);
    // incp3.getNodes().size.should.equals(2);

    function map(nodes) {
      return Array.from(nodes).map(node => {
        return `${node.getId()} ${node.is_client ? 1 : 0}`
      });
    }
  });

  // it('should ok with two instances', function *() {
  //   const incp1 = new INCP();
  //   const incp2 = new INCP();
  //   const incp3 = new INCP();
  //
  //   yield [
  //     cb => incp1.once('ready', cb),
  //     cb => incp2.once('ready', cb),
  //     cb => incp3.once('ready', cb),
  //   ];
  //
  //   const nodes = yield [[
  //     incp1.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
  //     incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
  //     incp1.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port)
  //   ], [
  //     incp2.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
  //     incp2.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
  //     incp2.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port)
  //   ], [
  //     incp3.connectTo(incp1.config.getOptions().host, incp1.config.getOptions().port),
  //     incp3.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port),
  //     incp3.connectTo(incp3.config.getOptions().host, incp3.config.getOptions().port)
  //   ]];
  //
  //   yield cb => setTimeout(cb, 1000);
  //
  //   console.log(incp1.getId(), incp1.getNodes().keys());
  //   console.log(incp2.getId(), incp2.getNodes().keys());
  //   console.log(incp3.getId(), incp3.getNodes().keys());
  //
  //   // incp1.getNodes().size.should.equals(2);
  //   // incp2.getNodes().size.should.equals(2);
  //   // incp3.getNodes().size.should.equals(2);
  // });


  // it('should destroy server the connection and work just fine', function *() {
  //   const incp1 = new INCP();
  //   const incp2 = new INCP();
  //
  //   yield [
  //     cb => incp1.once('ready', cb),
  //     cb => incp2.once('ready', cb),
  //   ];
  //
  //   const node = yield incp1.connectTo(incp2.config.getOptions().host, incp2.config.getOptions().port);
  //
  //   incp2.onRequest = function *(msg) {
  //     incp2.getNodes().get(incp1.getId()).getSocket().end();
  //     return msg.asd;
  //   };
  //
  //   yield cb => setTimeout(cb, 500);
  //
  //   const response1 = yield tryCatch(node.request({
  //     asd: 34
  //   }));
  // });
});
