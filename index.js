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
  return yield this.manager.connect(address);
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
 */
IC.prototype.ensureConnected = function *() {
  let prevPromises = [];

  while (true) {
    let promises = Array.from(this.manager.mapById.values()).map(function (node) {
      return node.duplexDFD.promise;
    });

    if (promises.length === prevPromises.length) {
      break;
    }

    yield promises;
    prevPromises = promises;
  }
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

/**
 *
 * @param id
 * @returns {V}
 */
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
  let executed = callbacks.execute(id, success, data);
  //console.error('RESPOND', id, success, executed, data);
  return executed;
};

IC.prototype.shutdown = function *() {

};

IC.prototype.getId = function () {
  return this.manager.cfg.id;
};