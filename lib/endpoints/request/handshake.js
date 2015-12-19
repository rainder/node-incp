'use strict';

const q = require('q');
const co = require('co');
const debug = require('debug')('intercon:handshake');

module.exports = function *(data, socket, thisNode) {
  //debug('GOT', data);
  const manager = thisNode.manager;

  let node = manager.getOrCreateNode(data.id);

  node.setServerSocket(socket);
  node.serverCfg = data;

  if (!node.isClientSocketAlive()) {
    yield manager.connect(data);
  }

  let suggestion = [];

  for (let node of manager.mapById.entries()) {
    if (node[0] === data.id) {
      continue;
    }
    suggestion.push(node[0]);
  }

  return {
    cfg: manager.cfg,
    suggestion: suggestion
  };
};