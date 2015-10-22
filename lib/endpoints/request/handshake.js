'use strict';

const Node = require('app/node');
const debug = require('debug')('app:handshake');

module.exports = function *(data, socket) {
  debug('got', data);
  //console.error(data, socket);

  if (this.app.mapById.get(data.id)) {
    throw new Error('Connection is already established');
  }

  const node = new Node(data, socket);
  yield this.app.assignNode(node);

  return {
    id: this.app.id,
    type: this.app.options.type,
    name: this.app.options.name,
    host: this.app.options.host,
    port: this.app.options.port
  };
};