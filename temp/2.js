'use strict';

const Intercon = require('./..');
const q = require('q');
const co = require('co');
const utils = {
  printError: function (err) {
    console.error(err.stack || err);
  },
  sleep: (timeout) => (cb) => setTimeout(cb, timeout)
};

const NUMBER_OF_INSTANCES = 30;
const BASE_PORT = 8900;
const cfgs = [];

for (let i = 0; i < NUMBER_OF_INSTANCES; i++) {
  let nodes = [];
  let port = BASE_PORT + i;

  for (let j = 0; j < NUMBER_OF_INSTANCES; j++) {
    if (BASE_PORT + j !== port) {
      nodes.push(BASE_PORT + j);
    }
  }

  cfgs.push({
    name: i,
    port: port,
    nodes: nodes
  });
}

co(function *() {
  let ps = [];
  let ics = [];

  for (let cfg of cfgs) {

    const ic = new Intercon({
      name: cfg.name,
      type: 'wsapi',
      host: '127.0.0.1',
      port: cfg.port
    });

    ics[ics.length] = ic;

    yield ic.startServer();
    let sps = [];

    ic.on('internal-message', function (msg, node) {
      console.log(`${cfg.name} GOT ${msg}`);
    });

    for (let port of cfg.nodes) {
      let promise = ic.connect({
        host: '127.0.0.1',
        port: port
      }, { persistent: true });
      ps[ps.length] = promise;
      sps[sps.length] = promise;
    }
  }

  yield ps;

  yield utils.sleep(500);
  console.log('OK??');

  let conns = yield ics.map(function (ic) {
    return ic.manager.server.getConnections();
  });

  console.log('###', conns.reduce(function (a, b) {
    return a + b;
  }) === NUMBER_OF_INSTANCES * (NUMBER_OF_INSTANCES - 1));

}).catch(utils.printError);