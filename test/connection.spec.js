'use strict';

const co = require('co');
const net = require('net');
const INCP = require('./..');
require('chai').should();

describe('connection', function () {
  this.timeout(2000);

  it('should create servers', co.wrap(function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    const r = yield [
      incp1.startServer(),
      incp2.startServer(),
    ];

    r[0].address.should.equals('0.0.0.0');
    r[0].family.should.equals('IPv4');
    r[0].port.should.gt(0);

    yield [
      incp1.shutdown(),
      incp2.shutdown(),
    ];
  }));

  it('should fail to connect to the server', co.wrap(function *() {
    const incp1 = new INCP();
    const incp2 = new INCP();

    yield [
      incp1.startServer(),
      incp2.startServer(),
    ];

    const r = yield incp1.connectTo(38986, null, { max_retries_count: 0 }).catch(() => true);

    r.should.equals(true);

    yield [
      incp1.shutdown(),
      incp2.shutdown(),
    ];
  }));

  it('should connect to the server', co.wrap(function *() {
    const incp1 = new INCP({
      id: 2,
    });
    const incp2 = new INCP({
      id: 1,
    });

    yield [
      incp1.startServer(),
      incp2.startServer(),
    ];

    yield incp1.connectTo(incp2.getConfiguration().getPort());

    yield cb => setTimeout(cb, 10);

    yield [
      incp1.shutdown(),
      incp2.shutdown(),
    ];
  }));

  it('should send invalid proto', co.wrap(function *() {
    const incp = new INCP();

    yield incp.startServer();

    const socket = net.connect(incp.getConfiguration().getPort());

    yield cb => socket.once('connect', cb);

    yield cb => setTimeout(cb, 100);

    yield incp.getServer().getConnections().then((c) => c.should.equals(1));

    const closePromise = co(function *() {
      yield cb => socket.once('close', cb);
    });

    const err = yield cb => {
      incp.on('error', (err) => {
        cb(null, err);
      });

      socket.write('hello');
    };

    err.errno.should.equals(INCP.Error.INVALID_PROTO.errno());

    yield cb => setTimeout(cb, 100);

    //sever should have no connections
    yield incp.getServer().getConnections().then((c) => c.should.equals(0));

    //client should get close event
    yield closePromise;

    yield cb => setTimeout(cb, 10);

    yield incp.shutdown();
  }));

  it('should test concurrent connection', co.wrap(function *() {
    const incp1 = new INCP({ id: 2 });
    const incp2 = new INCP({ id: 1 });

    yield [
      incp1.startServer(),
      incp2.startServer(),
    ];

    const nodes = yield [
      incp1.connectTo(incp2.getConfiguration().getPort()).catch(e => null),
      incp2.connectTo(incp1.getConfiguration().getPort()).catch(e => null)
    ];

    yield cb => setTimeout(cb, 100);

    incp1.getNodes().size.should.equals(1);
    incp2.getNodes().size.should.equals(1);

    yield [
      incp1.shutdown(),
      incp2.shutdown(),
    ];
  }));

  it('should reassign connection ownership', co.wrap(function *() {
    const incp1 = new INCP({
      id: 1,
    });
    const incp2 = new INCP({
      id: 2,
    });
    yield [incp1.startServer(), incp2.startServer()];

    yield incp1.connectTo(incp2.getConfiguration().getPort()).then(() => true.should.equals(false), () => true);

    //wait until reconnects
    yield cb => setTimeout(cb, 100);

    // console.dir([
    //   incp1.getConfiguration(),
    //   incp2.getConfiguration(),
    // ], { depth: 4, colors: true });

    incp1.getNodes().size.should.equals(1);
    incp2.getNodes().size.should.equals(1);

    Array.from(incp1.getNodes().values())[0].getConfiguration().getId()
      .should.equals(incp2.getConfiguration().getId());

    Array.from(incp2.getNodes().values())[0].getConfiguration().getId()
      .should.equals(incp1.getConfiguration().getId());

    yield [
      incp1.shutdown(),
      incp2.shutdown(),
    ];
  }));

  it('should send request', co.wrap(function *() {
    const incp1 = new INCP({ id: 2 });
    const incp2 = new INCP({ id: 1 });
    yield [incp1.startServer(), incp2.startServer()];

    yield incp1.connectTo(incp2.getConfiguration().getPort());

    incp2.onRequest = function *({ a }) {
      return a + 5;
    };

    const r = yield Array.from(incp1.getNodes().values())[0].request({ a: 5 });

    r.should.equals(10);
  }));

  it('should send push', co.wrap(function *() {
    const incp1 = new INCP({ id: 2 });
    const incp2 = new INCP({ id: 1 });
    yield [incp1.startServer(), incp2.startServer()];

    yield incp1.connectTo(incp2.getConfiguration().getPort());

    let r = 0;
    incp2.onPush = function *({ a }) {
      r += a;
    };

    yield Array.from(incp1.getNodes().values())[0].push({ a: 5 });

    yield cb => setTimeout(cb, 10);
    r.should.equals(5);
  }));


});
