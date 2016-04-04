'use strict';

const R = require('ramda');
const _ = require('lodash');
const validation = require('./../validation');
const Node = require('./../node');
const Request = require('./../message/ic-request');
const V = validation.V;

const validate = validation({
  'host': V(String).required(),
  'port': V(Number).required()
});

module.exports = function *(data) {
  const result = {
    runtime_id: this.ic.getRuntimeId(),
    type: this.ic.getType()
  };
  validate(data);

  const id = `${data.host}:${data.port}`;

  if (!this.ic.nodes.get(id)) {
    const node = new Node(data.host, data.port);
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

  return result;
};