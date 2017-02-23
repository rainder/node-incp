'use strict';

const path = require('path');
const INCPError = require('./incp-error');
const readdirDeep = require('@rainder/readdir-deep');

const endpoint = {
  request: readEndpoints('request'),
  push: readEndpoints('push'),
};

module.exports = {
  request,
  push,
};

/**
 *
 * @param incp
 * @param socket
 * @param payload
 * @returns {*}
 */
function request(incp, socket, payload) {
  const { method, data } = payload;

  if (!endpoint.request[method]) {
    throw new INCPError.INVALID_ENDPOINT(payload);
  }

  return endpoint.request[method]({ data, incp, socket });
}

/**
 *
 * @param incp
 * @param socket
 * @param payload
 * @returns {*}
 */
function push(incp, socket, payload) {
  const { method, data } = payload;

  if (!endpoint.push[method]) {
    throw new INCPError.INVALID_ENDPOINT(payload);
  }

  return endpoint.push[method]({ data, incp, socket });
}

/**
 *
 * @param subdir
 * @returns {{}}
 */
function readEndpoints(subdir) {
  const dir = path.resolve(__dirname, 'endpoint', subdir);
  const items = readdirDeep.readSync(dir);
  const result = {};

  for (const item of items) {
    const method = item
      .substr(dir.length + 1, item.length - dir.length - 4)
      .replace(/\//g, '.');

    result[method] = require(item);
  }

  return result;
}
