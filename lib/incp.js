'use strict';

const _ = require('lodash');
const co = require('co');
const os = require('os');
const debug = require('debug');
const events = require('events');
const objectid = require('objectid');

const Server = require('./server');
const Node = require('./node');
const router = require('./router');
const ICError = require('./ic-error');
const EventEmitter = events.EventEmitter;
const ICRequest = require('./message/ic-request');
const ICResponse = require('./message/ic-response');

const PACKAGE_JSON = require('./../package.json');
const d = debug('incp:core');

module.exports = class INCP extends EventEmitter {
  constructor(config) {
    super();

    this.id = objectid().toString();
    this.config = _.defaults(config, {
      group: 'default',
      host: '0.0.0.0',
      port: 0,
      flags: {}
    });
    this.nodes = new Map();
    this.server = new Server(config);

    this.server.setRequestHandler((socket, message) => router.route(this, socket, message));
  }

  /**
   *
   * @returns {*}
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @returns {*}
   */
  getConfig() {
    return this.config;
  }

  /**
   *
   * @param id
   * @returns {Node}
   */
  getNodeById(id) {
    return this.nodes.get(id);
  }

  /**
   *
   * @param host
   * @param port
   * @returns {*|Promise}
   */
  connectTo({ host, port }) {
    const self = this;

    return co(function *() {
      const node = new Node({
        id: self.id,
        port: self.server.port
      }, {
        host: host,
        port: port
      });
      const response = yield node.init();

      if (self.nodes.has(response.id)) {
        node.close();
        return;
      }

      if (response.id === self.id) {
        node.close();
        return;
      }

      if (response.protocol !== 'incp') {
        throw new ICError.INVALID_PROTOCOL(`${response.protocol}`);
      }

      if (response.version !== PACKAGE_JSON.version) {
        throw new ICError.INCOMPATIBLE_VERSIONS(`local: ${PACKAGE_JSON.version} remote: ${response.version}`);
      }

      if (self.config.group || response.config.group) {
        if (response.config.group !== self.config.group) {
          throw new ICError.GROUP_MISMATCH(`local: ${self.config.group} remote: ${response.config.group}`);
        }
      }

      self.nodes.set(response.id, node);
      self.emit('node-add', node);

      node.options.remote.flags = response.config.flags;

      node.getSocket().once('close', () => {
        self.nodes.delete(response.id);
        self.emit('node-remove', node);
        if (node.reconnect) {
          self._reconnect(host, port);
        }
      });

      yield node.introduce(self.id, self.server.port);
      yield node.suggest(response.id, self.nodes);
    });
  }

  /**
   *
   * @param host
   * @param port
   * @private
   */
  _reconnect(host, port) {
    const self = this;

    co(function *() {
      for (let i = 0; i < 1e2; i++) {
        const delay = Math.min(10000, Math.pow(i, 2) * 2 + 500)

        try {
          d(`node reconnect attempt no ${i} in ${delay}ms`);
          yield cb => setTimeout(cb, delay);
          yield self.connectTo({ host, port });
          return;
        } catch (e) {
        }
      }

      console.error(`Giving up on reconnection to ${host}:${port}`);
    });
  }

  /**
   *
   * @returns {*|Promise}
   */
  start() {
    const self = this;

    return co(function *() {
      yield self.server.listen();
    });
  }

  /**
   *
   * @param handler
   * @returns {INCP}
   */
  setMessageHandler(handler) {
    this._onMessage = handler;
    return this;
  }

  /**
   *
   * @private
   */
  *_onMessage() {
    console.error('not implemented');
  }

  /**
   *
   * @param id
   * @param data
   * @returns {*}
   */
  sendToNode(id, data) {
    const node = this.nodes.get(id);
    if (!node) {
      throw new ICError.NODE_NOT_FOUND(id);
    }

    return ICRequest.create('external', data).send(node.getSocket());
  }

  /**
   *
   * @returns {*|Promise}
   */
  shutdown() {
    return co(function *() {
      for (let [id, node] of this.nodes.entries()) {
        yield node.shutdown(this.id);
        this.nodes.delete(id);
      }

      this.server.getServer().close();
    }.call(this));
  }

  /**
   *
   * @param key
   * @param value
   * @returns {*|Promise}
   */
  flag(key, value) {
    return co(function *() {
      this.config.flags[key] = value;

      for (let [id, node] of this.nodes.entries()) {
        yield node.flag(this.id, key, value);
      }

    }.call(this));
  }

  /**
   *
   * @returns {Map}
   */
  getNodes() {
    return this.nodes;
  }
}