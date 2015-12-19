'use strict';

const co = require('co');
const requireDir = require('require-dir');
const manager = require('./manager');
const objectDeep = require('object-deep');
const debug = require('debug');

const endpoints = requireDir('./endpoints', { recurse: true });
const callbacks = require('./callbacks');

const d = debug('intercon-core:message-handler');

module.exports = function handler(node, message, socket, cb) {
  d('GOT', message);
  if (message.type === 'response') {
    return callbacks.execute(message.id, message.success, message.data);
  }

  const endpoint = `${message.type}.${message.method}`;
  const fn = objectDeep.get(endpoints, endpoint);

  if (!fn) {
    let err = `Endpoint does not exist ${endpoint}`;
    return fail({
      message: err
    });
  }

  co(fn(message.data, socket, node)).then(success, fail);

  function success(data) {
    if (message.type === 'request') {
      cb(null, data);
    }
  }

  function fail(err) {
    cb(err, null);
  }
}