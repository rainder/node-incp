'use strict';

const colors = require('colors');
const clear = require('clear');
const co = require('co');
const IC = require('./..');

let inc = 0;

co(function *() {
  clear();
  yield (cb) => setTimeout(cb, 200);

  let random = Math.round(Math.random() * 10);
  let ic = new IC({
    name: 'poi',
    type: process.env.TYPE || `poi${inc++}`,
    host: '127.0.0.1',
    port: process.env.PORT
  });

  console.log(colors.green(process.env.TYPE + ' ' + process.env.PORT + ' ' + process.env.TARGETS));

  ic.on('message', (message, respond) => {
    console.log(`GOT MESSAGE`, message);
    respond(null, 'response');
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


  //process.on('SIGINT', function () {
  //  co(function *() {
  //    return yield ic.shutdown();
  //  }).then(function () {
  //    console.log(arguments);
  //  });
  //
  //  setTimeout(function () {
  //    console.log('KILL'.red);
  //    process.exit(1);
  //  }, 3000).unref();
  //});

  //yield (cb) => setTimeout(cb, 1000);

  let node = ic.getRandomNodeByType('brain');
  if (!node) {
    console.error('COUNT NOT FIND NODE');
    return;
  }
  let response = yield node.sendRequest({ a: Math.random() });
  console.log(response);

}).catch(function (err) {
  console.error(err.stack || err);
})

