'use strict';

const co = require('co');
const debug = require('debug');
const events = require('events');
const objectid = require('objectid');

const Server = require('./server');
const Node = require('./node');
const router = require('./router');
const ICError = require('./ic-error');
const Loopback = require('./loopback');
const EventEmitter = events.EventEmitter;
const ICRequest = require('./message/ic-request');
const ICResponse = require('./message/ic-response');

const PACKAGE_JSON = require('./../package.json');
const d = debug('incp:core');

class INCP extends EventEmitter {
  constructor(config) {
    super();

    this.id = objectid().toString();
    this.config = config;
    this.nodes = new Map();
    this.server = new Server(config);

    // this.nodes.set(this.id, new Loopback(this, {
    //   requestHandler: (socket, message) => router.route(this, socket, message)
    // }));

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
        local: {
          id: self.id,
          port: self.server.port,
        },
        remote: {
          host: host,
          port: port
        }
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
        throw new ICError.INCOMPATIBLE_VERSIONS(`remote: ${data.version}`);
      }

      self.nodes.set(response.id, node);
      self.emit('node-add', node);

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
        } catch (e) {}
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
    const self = this;
    return co(function *() {
      for (let [id, node] of self.nodes.entries()) {
        yield node.shutdown(self.id);
        self.nodes.delete(id);
      }
    });
  }

  /**
   *
   * @returns {Map}
   */
  getNodes() {
    return this.nodes;
  }
}

INCP.Loopback = Loopback;

module.exports = INCP;