'use strict';

const Request = require('./message/ic-request');
const debug = require('debug');
const d = debug('incp:introduce-send');

module.exports = {
  callbackToPromise,
  introduce
};

/**
 *
 * @param resolve
 * @param reject
 * @returns {Function}
 */
function callbackToPromise(resolve, reject) {
  return function (err, data) {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  };
}

/**
 *
 * @param ic
 */
function introduce(ic, node) {
  const otherNodes = Array.from(ic.nodes.values())
    .filter(item => item.getId() !== node.getId())
    .map(item => item.getId());

  d(`to ${node.getId()}`, otherNodes);

  return Request
    .create('introduce', {
      ids: otherNodes
    })
    .send(node.getSocket());
}