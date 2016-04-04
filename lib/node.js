'use strict';

const R = require('ramda');
const co = require('co');
const net = require('net');

const utils = require('./utils');
const dataHandler = require('./data-handler');
const Request = require('./message/ic-request');

const SOCKET$ = Symbol();

module.exports = class Node {
  constructor(host, port) {
    this.id = `${host}:${port}`;
    this.host = host;
    this.port = port;
    this.info = {};

    this.connectionFailureCount = 0;

    const socket = net.Socket();

    socket.on('error', (err) => this._onError(err));
    socket.on('close', (err) => this._onClose(err));
    socket.on('connect', () => this._onConnect());
    socket.on('data', dataHandler.handle((message) => this._onMessage(socket, message)));

    socket.setEncoding('utf-8')
      .setKeepAlive(true, 30000)
      .setNoDelay(true);

    this[SOCKET$] = socket;
  }

  /**
   *
   * @param err
   * @private
   */
  _onError(err) {
    console.error('INCP Node Error:', err.message);
  }

  /**
   *
   * @private
   */
  _onClose() {
    console.error(`INCP Node connection closed ${this.id}`);
    const reconnect = R.bind(this._reconnect, this);
    const timeout = this._getReconnectTimeout(this.connectionFailureCount++);

    setTimeout(reconnect, timeout).unref();
  }

  /**
   *
   * @private
   */
  _reconnect() {
    console.log('reconnect attempt no', this.connectionFailureCount);
    this.connect();
  }

  /**
   *
   * @private
   */
  _onConnect() {
    console.log(`INCP Node connection established ${this.id}`);
    this.connectionFailureCount = 0;
  }

  /**
   *
   * @param failureCount
   * @returns {number}
   * @private
   */
  _getReconnectTimeout(failureCount) {
    return Math.min(5000, Math.pow(failureCount, 2) * 2 + 0);
  }

  /**
   *
   * @param socket
   * @param message
   * @private
   */
  _onMessage(socket, message) {
    console.log(`unhandled node message`, message);
  }

  /**
   *
   * @param handler
   * @returns {Node}
   */
  setMessageHandler(handler) {
    this._onMessage = handler;
    return this;
  }

  /**
   *
   * @returns {Promise}
   */
  connect() {
    const connectionOptions = {
      host: this.host,
      port: this.port
    };

    return co(function *() {
      while (true) {
        try {
          yield cb => this[SOCKET$].connect(connectionOptions, cb);
          break;
        } catch (e) {
          this._onClose();
        }
      }
    }.call(this));
  }

  /**
   *
   * @returns {String}
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @returns {String}
   */
  getType() {
    return this.info.type;
  }

  /**
   *
   * @returns {Socket}
   */
  getSocket() {
    return this[SOCKET$];
  }

  /**
   *
   * @param data
   * @returns {*|boolean}
   */
  send(data) {
    return Request.create('external', data).send(this.getSocket());
  }
};