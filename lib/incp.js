'use strict';

const co = require('co');
const { tryCatch } = require('co-try-catch');
const events = require('events');
const Client = require('./client');
const Server = require('./server');
const Config = require('./config');
const Loopback = require('./loopback');
const Node = require('./node');
const DataHandler = require('./data-handler');
const INCPError = require('./incp-error');

const SERVER$ = Symbol();
const NODES$ = Symbol();
const LOOPBACK$ = Symbol();
const DATA_HANDLER$ = Symbol();

module.exports = class INCP extends events {
  /**
   *
   * @param (options) {{host, port, group, metadata}}
   */
  constructor(options = {}) {
    super();

    this.config = new Config(options);

    this[DATA_HANDLER$] = new DataHandler(this);
    this[LOOPBACK$] = new Loopback(this);
    this[NODES$] = new Map();
    this[SERVER$] = new Server(this.config, this[DATA_HANDLER$]);
    this[SERVER$].getServer().once('listening', () => this.emit('ready'));

    // this._introduceAll();
  }

  // /**
  //  *
  //  * @private
  //  */
  // _introduceAll() {
  //   for (let node of this[NODES$].values()) {
  //     node._introduce(this[NODES$].values());
  //   }
  //
  //   const timeout = Math.round(60000 * (1 + Math.random()));
  //   setTimeout(() => this._introduceAll(), timeout).unref();
  // }

  /**
   *
   * @param node {Node}
   * @returns {Promise}
   * @private
   */
  _registerNode(node) {
    node.getSocket().on('close', () => {
      //do not drop node if socket does not belong to it
      if (node !== this[NODES$].get(node.getId())) {
        return;
      }

      this[NODES$].delete(node.getId());
      this.emit('node-remove', node);
      node.getSocket().removeAllListeners();
    });

    this[NODES$].set(node.getId(), node);
    this.emit('node-add', node);
  }

  /**
   *
   * @param handshakeResponse
   * @returns {*}
   * @private
   */
  *_processHandshakeResponse(handshakeResponse, client) {
    //already have a connection with this node
    if (this[NODES$].has(handshakeResponse.id)) {
      const node = this[NODES$].get(handshakeResponse.id);

      //drop lowest
      if (this.config.getId() > handshakeResponse.id) {
        client.getSocket().end();

        return node;
      }
    }

    if (this.getId() === handshakeResponse.id) {
      client.getSocket().end();

      return this[LOOPBACK$];
    }

    const node = Node.createFromClientSocket(this[DATA_HANDLER$], client.getSocket(), handshakeResponse);

    this._registerNode(node);
    yield node._introduce(this[NODES$].values());

    return node;
  }

  /**
   *
   * @param host {String}
   * @param port {Number
   * @returns {Node|Loopback|undefined}
   * @private
   */
  *_connectTo(host, port) {
    for (const node of this.getNodes().values()) {
      if (node.host === host && node.port === port) {
        return node;
      }
    }

    const client = yield Client.create(host, port, this[DATA_HANDLER$]);
    const handshakeRequest = Node._handshake(this[DATA_HANDLER$], client.getSocket(), this.config);
    const { err, result } = yield tryCatch(handshakeRequest);

    if (err) {
      client.getSocket().end();

      if (err.errno === INCPError.ALREADY_CONNECTED.errno()) {
        return this[NODES$].get(err.info.id);
      }

      throw err;
    }

    return yield this._processHandshakeResponse(result, client);
  }

  /**
   *
   * @param host {String}
   * @param port {Number
   * @returns {Promise}
   */
  connectTo(host, port) {
    return co(this._connectTo(host, port));
  }

  /**
   *
   * @returns {String}
   */
  getId() {
    return this.config.getId();
  }

  /**
   *
   * @returns {*}
   */
  getServer() {
    return this[SERVER$];
  }

  /**
   *
   * @returns {Iterator}
   */
  getNodes() {
    return this[NODES$];
  }

  /**
   *
   * @returns {Loopback}
   */
  getLoopback() {
    return this[LOOPBACK$];
  }

  /**
   *
   * @returns {*}
   */
  getDataHandler() {
    return this[DATA_HANDLER$];
  }

  /**
   *
   * @param key
   * @param value
   */
  *setMetadata(key, value) {
    this.config.setMetadata(key, value);
    for (const node of this.getNodes().values()) {
      yield node._metadata(this.config.getMetadata());
    }
  }

  /**
   *
   */
  shutdown() {
    for (const node of this.getNodes().values()) {
      node.getSocket().end();
    }

    this[SERVER$].close();

    return Promise.resolve(true);
  }

  /**
   *
   */
  /*override*/
  onRequest() {
    throw new Error('not implemented');
  }

  /**
   *
   */
  /*override*/
  onPush() {
    throw new Error('not implemented');
  }
};
