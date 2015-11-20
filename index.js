'use strict';

const _ = require('lodash');
const util = require('util');
const events = require('events');
const os = require('os');

const Manager = require('./lib/manager');
const utils = require('./lib/utils');
const Node = require('./lib/node');
const callbacks = require('./lib/callbacks');
const dataHandler = require('./lib/data-handler');

module.exports = IC;

util.inherits(IC, events.EventEmitter);

/**
 *
 * @param options
 * @constructor
 */
function IC(options) {
  this.options = options;
  this.manager = new Manager(options);
  this.nodes = new Set();

  utils.pipeEvent('established', this.manager, this);
  utils.pipeEvent('message', this.manager, this);
  utils.pipeEvent('error', this.manager, this);
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

IC.prototype.status = function *() {
  let numberOfServerConnections = yield (cb) => {
    this.manager.server.server.getConnections(cb);
  };

  let result = {
    id: utils.toPublicId(this.options),
    h: os.hostname(),
    l: os.loadavg(),
    pid: process.pid,
    nodes: [],
    number_of_server_connections: numberOfServerConnections
  };

  for (let node of this.manager.mapById.values()) {
    let response = yield dataHandler.req(node.getSocket(), 'status', {});
    result.nodes.push(response);
  }

  return result;
};