'use strict';

const co = require('co');
const requireDir = require('require-dir');
const manager = require('./manager');
const objectDeep = require('object-deep');

const endpoints = requireDir('./endpoints', { recurse: true });
const dataHandler = require('./data-handler');
const callbacks = require('app/callbacks');

module.exports = handler;

function handler(message, socket) {
  if (message.type === 'response') {
    callbacks.execute(message.id, message.success, message.data);
    return;
  }

  const endpoint = `${message.type}.${message.method}`;
  const fn = objectDeep.get(endpoints, endpoint);
  const ctx = {
    dataHandler,
    app: this
  };

  if (!fn) {
    let err = `Endpoint does not exist ${endpoint}`;
    return fail({
      message: err
    });
  }

  co(fn.call(ctx, message.data, socket)).then(success, fail);

  function success(data) {
    if (message.type === 'request') {
      dataHandler.outcoming(socket, dataHandler.make.res(message.id, true, data));
    }
  }

  function fail(err) {
    if (message.id) {
      dataHandler.outcoming(socket, dataHandler.make.res(message.id, false, err));
    }
    console.error('err: ', err.stack || err);
  }
}