'use strict';

const _ = require('lodash');
const util = require('util');
const events = require('events');
const q = require('q');
const co = require('co');

const Client = require('./client');
const Server = require('./server');
const messageHandler = require('./message-handler');
const utils = require('./utils');
const dataHandler = require('./data-handler');
const Node = require('./node');
const GroupedCollection = require('./grouped-collection');

module.exports = Manager;

function Manager(options) {
  this.id = `${options.host}:${options.port}`;
  //this.id = objectid().toString();
  this.mapById = new Map();
  this.mapByType = new GroupedCollection();
  this.options = options;
  this.socketNodeMap = new WeakMap();
  this.connectionQueue = q.when(true);
  this.weight = Math.random();

  //setInterval(() => {
  //  console.log(Array.from(this.mapById.keys()));
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
  let dfd = q.defer();
  yield this.connectionQueue;

  this.connectionQueue = q.when(this.connectionQueue).then(function () {
    return dfd.promise;
  });

  let client = new Client(address.host, address.port);
  let result = yield utils.tryCatch(client.connect());
  if (result.err) {
    dfd.resolve();
    return console.error('Failed to connect to', address);
  }

  client.on('message', _.bind(messageHandler, this));
  utils.pipeEvent('error', client, this);

  let handshakeResponse = yield utils.tryCatch(dataHandler.req(client.socket, 'handshake', {
    id: this.id,
    type: this.options.type,
    name: this.options.name,
    host: this.options.host,
    port: this.options.port,
    weight: this.weight
  }));

  if (handshakeResponse.err) {
    client.socket.destroy();
    dfd.resolve();
    return;
  }
  
  client.setId(handshakeResponse.result.id);

  const node = new Node();
  node.setSocket(client.socket);
  node.setInfo(handshakeResponse.result);

  try {
    yield this.assignNode(node);
    yield this.suggestNodes(node);
  } catch (e) {
    //console.error(e);
  }

  dfd.resolve();
};

/**
 *
 * @param info
 * @param socket
 * @returns {boolean}
 */
Manager.prototype.assignNode = function *(node) {
  const close = () => {
    this.mapById.delete(node.getId());
    this.mapByType.delete(node.getType(), node);
    this.emit('close', node);
    console.log('>>> CLOSE');
  };

  if (this.mapById.has(node.getId())) {
    let previousNode = this.mapById.get(node.getId());

    if (node.getWeight() > this.weight) {
      previousNode.socket.removeAllListeners('close');
      previousNode.socket.destroy();
      previousNode.socket = node.socket;
    } else {
      node.socket.destroy();
      throw new Error('already connecteed');
    }
  }

  node.getSocket().on('close', close);

  this.mapById.set(node.getId(), node);
  this.mapByType.add(node.getType(), node);
  this.socketNodeMap.set(node.getSocket(), node);

  this.emit('established', node);
}

/**
 *
 * @param node
 */
Manager.prototype.suggestNodes = function *(node) {
  for (let targetNode of this.mapById.values()) {
    if (targetNode.getId() === node.getId()) {
      continue;
    }

    dataHandler.push(node.socket, 'suggest', {
      id: targetNode.getId(),
      data: targetNode.getInfo()
    });
  }
};