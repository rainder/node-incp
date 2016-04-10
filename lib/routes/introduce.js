'use strict';

const Node = require('./../node');
const Request = require('./../message/ic-request');
const V = require('./../validation');
const debug = require('debug');
const d = debug('incp:introduce-receive')

const validate = new V.Schema({
  'ids': V(Array).required()
});

module.exports = function *(data) {
  validate(data);

  d('got', data.ids);

  for (let id of data.ids) {
    if (this.ic.nodes.get(id)) {
      continue;
    }

    if (id === this.ic.getId()) {
      continue;
    }

    const parts = id.split(':');
    const node = new Node(parts[0], parts[1]);
    node.setMessageHandler((socket, message) => this.ic._onInternalMessage(socket, message));

    this.ic.nodes.set(id, node);
    yield node.connect();

    node.info = yield Request
      .create('handshake', {
        host: this.ic.options.host,
        port: this.ic.options.port
      })
      .send(node.getSocket());

    this.ic.nodesByType.add(node.info.type, node.getType(), node);
    this.ic.nodeById.set(node.getId(), node);
  }
};