'use strict';

const _ = require('lodash');
const util = require('util');
const events = require('events');

const Manager = require('./lib/manager');
const utils = require('./lib/utils');
const Node = require('app/node');
const callbacks = require('app/callbacks');

module.exports = IC;

util.inherits(IC, events.EventEmitter);

function IC(options) {
  this.options = options;
  this.manager = new Manager(options);
  this.nodes = new Set();

  utils.pipeEvent('established', this.manager, this);
  utils.pipeEvent('message', this.manager, this);

  //this.manager.on('established', (info, socket) => {
  //  let node = new Node(info, socket);
  //  this.nodes.add(node);
  //
  //  let collection = this.nodesByType.get(node.getType());
  //  if (!collection) {
  //    collection = new Set();
  //    this.nodesByType.set(info.type, collection);
  //  }
  //
  //  collection.push(node);
  //});
}

/**
 *
 */
IC.prototype.startServer = function *() {
  yield this.manager.startServer();
};

/**
 *
 * @param address
 */
IC.prototype.connect = function *(address) {
  yield this.manager.connect(address);
};

/**
 *
 * @param data
 * @returns {Array}
 */
IC.prototype.broadcast = function (data) {
  let promises = [];

  for (let node of this.manager.mapById.values()) {
    promises[promises.length] = node.sendPush(data);
  }

  return promises;
};

/**
 *
 * @param type
 * @returns {*}
 */
IC.prototype.getRandomNodeByType = function (type) {
  let collection = this.manager.mapByType.get(type);
  if (!collection) {
    return null;
  }

  let index = utils.getRandomInt(0, collection.length - 1);
  return collection[index];
};

IC.prototype.getNodeById = function (id) {
  return this.manager.mapById.get(id);
};

/**
 *
 * @param id {*}
 * @param success {boolean}
 * @param data {*}
 * @returns {boolean}
 */
IC.prototype.respond = function (id, success, data) {
  return callbacks.execute(id, success, data);
};

IC.prototype.shutdown = function *() {

};

IC.prototype.getId = function () {
  return this.manager.id;
};