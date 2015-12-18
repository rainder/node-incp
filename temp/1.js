'use strict';

const colors = require('colors');
const clear = require('clear');
const co = require('co');
const IC = require('./..');

let inc = 0;

co(function *() {
  clear();
  let random = Math.round(Math.random() * 10);
  let ic = new IC({
    name: 'poi',
    type: process.env.TYPE || `poi${inc++}`,
    host: '127.0.0.1',
    port: process.env.PORT
  });

  ic.on('message', (message, node) => {
    console.log(`GoT MESSAGE FROM ${node}`, message);
    ic.respond(message.id, true, { h: 5 });
  });

  yield ic.startServer();

  if (process.env.TARGETS) {
    let targets = process.env.TARGETS.split(',');

    for (let target of targets) {
      let node = yield ic.connect({
        host: '127.0.0.1',
        port: target
      });
    }
  }

  console.log('waiting'.yellow);

  yield ic.ensureConnected();

  console.log('OK!'.red);

  yield (cb) => setTimeout(cb, 1000);
  console.log('executing');

  let node = ic.getRandomNodeByType('brain');
  if (!node) {
    console.error('COUNT NOT FIND NODE');
    return;
  }
  let response = yield node.sendRequest({ a: 5 });
  console.log(response);


}).catch(function (err) {
  console.error(err.stack || err);
})

