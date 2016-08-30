'use strict';

const co = require('co');
const tryCatch = require('co-try-catch');
const bson = require('bson');
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

module.exports = class INCP extends events {
  /**
   *
   * @param options
   */
  constructor(options = {}) {
    super();

    this.config = new Config(options);
    this.dataHandler = new DataHandler(this);

    this[NODES$] = new Map();
    this[SERVER$] = new Server(this.config);
    this[SERVER$].onReady = () => this.emit('ready');
    this[SERVER$]._server.on('connection', (connection) => {
      connection.on('error', () => {
      });
      this.dataHandler.init(connection);
    });
    this[LOOPBACK$] = new Loopback(this);
  }

  /**
   *
   * @param host {String}
   * @param port {Number
   * @returns {Promise}
   */
  connectTo(host, port) {
    return co(function *() {
      for (let node of this.getNodes().values()) {
        if (node.host === host && node.port === port) {
          return node;
        }
      }

      const client = new Client(host, port);
      this.dataHandler.init(client.getSocket());

      yield client.waitForConnection();

      const node = new Node(this.dataHandler, this.config, client.getSocket(), true);
      const handshakeResponse = yield tryCatch(node._handshake());

      if (handshakeResponse.err) {
        client.close();

        if (handshakeResponse.err.errno === INCPError.ALREADY_CONNECTED.errno()) {
          return this[NODES$].get(handshakeResponse.err.info.id);
        }

        throw handshakeResponse.err;
      }

      if (this[NODES$].has(handshakeResponse.result.id)) {
        if (this.config.getId() > handshakeResponse.result.id) {
          client.close()
          return this[NODES$].get(handshakeResponse.result.id);
        }
      }

      if (this.getId() === handshakeResponse.result.id) {
        client.close();
        return this[LOOPBACK$];
      }

      yield node._introduce(this.getNodes().values());

      this[NODES$].set(handshakeResponse.result.id, node);
      client.getSocket().once('close', () => {
        this[NODES$].delete(handshakeResponse.result.id);
      });

      return node;
    }.call(this));
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
   * @param key
   * @param value
   */
  *setMetadata(key, value) {
    this.config.setMetadata(key, value);
    for (let node of this.getNodes().values()) {
      yield node._metadata(this.config.getMetadata());
    }
  }

  /**
   *
   */
  onRequest() {
    throw new Error('not implemented');
  }

  /**
   *
   */
  onPush() {
    throw new Error('not implemented');
  }
};
