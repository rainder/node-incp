'use strict';

const net = require('net');
const INCP = require('./..');
require('chai').should();

describe('connection', function () {
  this.timeout(2000);

  it('should create servers', async function () {
    const incp1 = new INCP();
    const incp2 = new INCP();

    const r = await Promise.all([
      incp1.startServer(),
      incp2.startServer(),
    ]);

    r[0].address.should.equals('0.0.0.0');
    r[0].family.should.equals('IPv4');
    r[0].port.should.gt(0);

    await Promise.all([
      incp1.shutdown(),
      incp2.shutdown(),
    ]);
  });

  it('should fail to connect to the server', async function () {
    const incp1 = new INCP();
    const incp2 = new INCP();

    await Promise.all([
      incp1.startServer(),
      incp2.startServer(),
    ]);

    const r = await incp1.connectTo(38986, null, { max_retries_count: 0 }).catch(() => true);

    r.should.equals(true);

    await Promise.all([
      incp1.shutdown(),
      incp2.shutdown(),
    ]);
  });

  it('should connect to the server', async function () {
    const incp1 = new INCP({
      id: 2,
    });
    const incp2 = new INCP({
      id: 1,
    });

    await Promise.all([
      incp1.startServer(),
      incp2.startServer(),
    ]);

    await incp1.connectTo(incp2.getConfiguration().getPort());

    await new Promise((cb) => setTimeout(cb, 10));

    await Promise.all([
      incp1.shutdown(),
      incp2.shutdown(),
    ]);
  });

  it('should send invalid proto', async function () {
    const incp = new INCP();

    await incp.startServer();

    const socket = net.connect(incp.getConfiguration().getPort());

    await new Promise((resolve, reject) => {
      socket.once('connect', (err) => {
        err ? reject(err) : resolve();
      });
    });

    await new Promise((cb) => setTimeout(cb, 100));

    await incp.getServer().getConnections().then((c) => c.should.equals(1));

    const closePromise = new Promise((resolve, reject) => {
      socket.once('close', (err) => err ? reject(err) : resolve());
    });

    const err = await new Promise((resolve) => {
      incp.on('error', (err) => {
        resolve(err);
      });

      socket.write('hello');
    });

    err.errno.should.equals(INCP.Error.INVALID_PROTO.errno());

    await new Promise((cb) => setTimeout(cb, 100));

    //sever should have no connections
    await incp.getServer().getConnections().then((c) => c.should.equals(0));

    //client should get close event
    await closePromise;

    await new Promise((cb) => setTimeout(cb, 10));

    await incp.shutdown();
  });

  it('should test concurrent connection', async function () {
    const incp1 = new INCP({ id: 2 });
    const incp2 = new INCP({ id: 1 });

    await Promise.all([
      incp1.startServer(),
      incp2.startServer(),
    ]);

    const nodes = await Promise.all([
      incp1.connectTo(incp2.getConfiguration().getPort()).catch(e => null),
      incp2.connectTo(incp1.getConfiguration().getPort()).catch(e => null)
    ]);

    await new Promise((cb) => setTimeout(cb, 100));

    incp1.getNodes().size.should.equals(1);
    incp2.getNodes().size.should.equals(1);

    await Promise.all([
      incp1.shutdown(),
      incp2.shutdown(),
    ]);
  });

  it('should reassign connection ownership', async function () {
    const incp1 = new INCP({
      id: 1,
    });
    const incp2 = new INCP({
      id: 2,
    });
    await Promise.all([incp1.startServer(), incp2.startServer()]);

    await incp1.connectTo(incp2.getConfiguration().getPort()).then(() => true.should.equals(false), () => true);

    //wait until reconnects
    await new Promise((cb) => setTimeout(cb, 100));

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

    await Promise.all([
      incp1.shutdown(),
      incp2.shutdown(),
    ]);
  });

  it('should send request', async function () {
    const incp1 = new INCP({ id: 2 });
    const incp2 = new INCP({ id: 1 });
    await Promise.all([incp1.startServer(), incp2.startServer()]);

    await incp1.connectTo(incp2.getConfiguration().getPort());

    incp2.onRequest = async({ a }) => {
      return a + 5;
    };

    const r = await Array.from(incp1.getNodes().values())[0].request({ a: 5 });

    r.should.equals(10);
  });

  it('should send push', async function () {
    const incp1 = new INCP({ id: 2 });
    const incp2 = new INCP({ id: 1 });
    await Promise.all([incp1.startServer(), incp2.startServer()]);

    await incp1.connectTo(incp2.getConfiguration().getPort());

    let r = 0;
    incp2.onPush = async({ a }) => {
      r += a;
    };

    await Array.from(incp1.getNodes().values())[0].push({ a: 5 });

    await new Promise((cb) => setTimeout(cb, 10));
    r.should.equals(5);
  });


});
