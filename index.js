'use strict';

const events = require('events');
const Manager = require('./lib/manager');
const utils = require('./lib/utils');
const callbacks = require('./lib/callbacks');

module.exports = class IC extends events.EventEmitter {
  /**
   *
   * @param options
   */
  constructor(options) {
    super();

    this.options = options;
    this.manager = new Manager(options);
    this.nodes = new Set();

    utils.pipeEvent('established', this.manager, this);
    utils.pipeEvent('message', this.manager, this);
    utils.pipeEvent('error', this.manager, this);
  }

  /**
   *
   * @returns {*}
   */
  *startServer() {
    return yield this.manager.startServer();
  }

  /**
   *
   * @returns {*}
   */
  *connect(address) {
    return yield this.manager.connect(address);
  }

  /**
   *
   */
  *ensureConnected() {
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
  }

  /**
   *
   * @param type
   * @returns {*}
   */
  getRandomNodeByType(type) {
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
   * @returns {*}
   */
  getNodeById(id) {
    return this.manager.mapById.get(id);
  }

  /**
   *
   * @param id
   * @param success
   * @param data
   * @returns {boolean}
   */
  respond(id, success, data) {
    return callbacks.execute(id, success, data);
  }

  /**
   *
   * @returns {*}
   */
  getId() {
    return this.manager.cfg.id;
  }

  /**
   *
   * @returns {*}
   */
  getType() {
    return this.manager.cfg.type;
  }

  /**
   *
   * @returns {*}
   */
  getLoopback() {
    return this.manager.loopback;
  }

  /**
   *
   */
  *shutdown() {
    return yield this.manager.shutdown();
  }
};