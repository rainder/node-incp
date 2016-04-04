'use strict';

const co = require('co');
const objectId = require('objectid');

const Server = require('./lib/server');
const router = require('./lib/router');
const validation = require('./lib/validation');
const Node = require('./lib/node');
const Request = require('./lib/message/ic-request');
const DoubleMap = require('./lib/double-map');
const utils = require('./lib/utils');

const V = validation.V;
const validate = validation([{
  $schema: {
    name: V(String).required(),
    type: V(String).required(),
    host: V(String).required(),
    port: V(Number).required()
  }
}]);

class IC {

  /**
   *
   * @param options {{host, port, type, name}}
   */
  constructor(options) {
    validate(options);

    this.runtimeId = objectId().toString();
    this.options = options;
    this.nodes = new Map();
    this.nodesByType = new DoubleMap();
    this.nodeById = new Map();

    const server = new Server(options.host, options.port);

    server.setMessageHandler((socket, message) => this._onInternalMessage(socket, message));

    this.server = server;

    setInterval(() => {
      console.log(`got ${this.nodes.size} nodes`);
    }, 1000);
  }

  /**
   *
   * @param options
   * @returns {IC}
   */
  static create(options) {
    return new IC(options);
  }

  /**
   *
   * @param socket
   * @param message
   * @private
   */
  _onInternalMessage(socket, message) {
    router.route(this, socket, message);
  }

  /**
   *
   */
  _onExternalMessage(message) {

  }

  /**
   *
   * @param messageHandler {Function*}
   * @returns {IC}
   */
  setMessageHandler(messageHandler) {
    this._onExternalMessage = messageHandler;
    return this;
  }

  /**
   *
   * @returns {Promise}
   */
  startServer() {
    return this.server.listen();
  }

  /**
   *
   * @returns {*}
   */
  getRuntimeId() {
    return this.runtimeId;
  }

  getName() {
    return this.options.name;
  }

  /**
   *
   * @returns {*}
   */
  getType() {
    return this.options.type;
  }

  /**
   *
   * @returns {*}
   */
  getId() {
    return `${this.options.host}:${this.options.port}`;
  }

  /**
   *
   * @returns {Map|*}
   */
  getNodes() {
    const result = [];

    for (let node of this.nodes.values()) {
      if (!node.info.type) {
        continue;
      }

      result.push(node);
    }

    return result;
  }

  /**
   *
   * @param type
   * @returns {V}
   */
  getNodesByType(type) {
    return this.nodesByType.getMap(type);
  }

  /**
   *
   */
  getNodeById(id) {
    return this.nodeById.get(id);
  }

  /**
   *
   * @param host
   * @param port
   */
  connectTo(host, port) {
    return co(function *() {
      const id = `${host}:${port}`;

      if (this.nodes.get('id')) {
        return this.nodes.get('id');
      }

      const node = new Node(host, port);
      node.setMessageHandler((socket, message) => this._onInternalMessage(socket, message));

      this.nodes.set(id, node);
      yield node.connect();

      node.info = yield Request
        .create('handshake', {
          host: this.options.host,
          port: this.options.port
        })
        .send(node.getSocket());

      this.nodesByType.add(node.info.type, node.getType(), node);
      this.nodeById.set(node.getId(), node);

      yield utils.introduce(this, node);

      return node;
    }.call(this));
  }

  /**
   *
   * @returns {Promise}
   */
  shutdown() {
    return new Promise((resolve, reject) => {
      this.server.close();
      resolve();
    });
  }
}

module.exports = IC;