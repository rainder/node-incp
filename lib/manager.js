'use strict';

const _ = require('lodash');
const objectid = require('objectid');
const util = require('util');
const events = require('events');

const Client = require('./client');
const Server = require('./server');
const messageHandler = require('./message-handler');
const utils = require('./utils');
const dataHandler = require('./data-handler');
const Node = require('app/node');
const GroupedCollection = require('app/grouped-collection');

module.exports = Manager;

function Manager(options) {
  this.id = `${options.host}:${options.port}`;
  //this.id = objectid().toString();
  this.map = new Map();
  this.mapByType = new GroupedCollection();
  this.options = options;
  this.socketNodeMap = new WeakMap();

  //setInterval(() => {
  //  console.log(Array.from(this.map.keys()), this.mapByType);
  //}, 1000);
}

util.inherits(Manager, events.EventEmitter);

/**
 *
 */
Manager.prototype.startServer = function *() {
  this.server = new Server({
    type: this.options.type,
    name: this.options.name,
    host: this.options.host,
    port: this.options.port
  });
  yield this.server.listen();

  this.server.on('message', _.bind(messageHandler, this));
};

/**
 *
 * @param address
 * @returns {*}
 */
Manager.prototype.connect = function *(address) {
  let client = new Client(address.host, address.port);
  let result = yield utils.tryCatch(client.connect());
  if (result.err) {
    return console.error('Failed to connect to', address);
  }

  client.on('message', _.bind(messageHandler, this));

  let handshakeResponse = yield dataHandler.req(client.socket, 'handshake', {
    id: this.id,
    type: this.options.type,
    name: this.options.name,
    host: this.options.host,
    port: this.options.port
  });

  client.setId(handshakeResponse.id);
  const node = new Node(handshakeResponse, client.socket);

  yield this.assignNode(node);
};

/**
 *
 * @param info
 * @param socket
 * @returns {boolean}
 */
Manager.prototype.assignNode = function *(node) {
  if (this.map.has(node.getId())) {
    this.map.get(node.getId()).getSocket().destroy();
    console.error('destroy');
    //node.socket.destroy();
    //return false;
  }

  this.socketNodeMap.set(node.getSocket(), node);

  node.getSocket().on('close', () => {
    this.map.delete(node.getId());
    this.mapByType.delete(node.getType(), node);
    this.emit('close', node);
  });

  this.map.set(node.getId(), node);
  this.mapByType.add(node.getType(), node);

  this.emit('established', node);

  for (let item of this.map.values()) {
    if (item.getId() === node.getId()) {
      continue;
    }

    dataHandler.push(node.socket, 'suggest', {
      id: item.getId(),
      data: item.getInfo()
    });
  }

  return true;
}