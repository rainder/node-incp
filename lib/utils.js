'use strict';

const _ = require('lodash');

module.exports = {
  parseAddress,
  callbackToDefer,
  tryCatch,
  getRandomInt,
  pipeEvent,
  toPublicId,
  makeIdFromAddress,
  makeAddressFromId
};

/**
 *
 * @param expression
 * @param defaultHost
 * @returns {{host: *, port: *}}
 */
function parseAddress(expression, defaultHost) {
  let pairs = expression.split(':');
  let host = pairs[0].length ? pairs[0] : defaultHost || pairs[0];
  let port = pairs[1];

  return { host, port };
}

/**
 *
 * @param dfd
 * @returns {Function}
 */
function callbackToDefer(dfd) {
  return function (err) {
    dfd[err ? 'reject' : 'resolve'](err);
  };
}

/**
 *
 * @param gen
 * @returns {*}
 */
function *tryCatch(gen) {
  let err;
  let result;

  try {
    result = yield gen;
  } catch (e) {
    err = e;
  }

  return { err, result };
}

/**
 *
 * @param name
 * @param source
 * @param target
 * @param ctx
 */
function pipeEvent(name, source, target, ctx) {
  source.on(name, function () {
    ctx = ctx || target;
    const args = [name].concat(Array.prototype.slice.call(arguments));

    target.emit.apply(ctx, args);
  });
}

/**
 *
 * @param min
 * @param max
 * @returns {*}
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 *
 * @param options
 */
function toPublicId(options) {
  return `${options.type}:${options.name}(${options.host}:${options.port})`;
}

/**
 *
 * @param address
 * @returns {*}
 */
function makeIdFromAddress(address) {
  return `${address.host}:${address.port}`;
}

/**
 *
 * @param id
 * @returns {{host: *, port: *}}
 */
function makeAddressFromId(id) {
  let parts = id.split(':');
  return {
    host: parts[0],
    port: parts[1]
  };
}