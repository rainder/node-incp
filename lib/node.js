'use strict';

const R = require('ramda');
const net = require('net');

const utils = require('./utils');
const dataHandler = require('./data-handler');
const Request = require('./message/ic-request');

const SOCKET$ = Symbol();

module.exports = class Node {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.info = {};

    this.connectionFailureCount = 0;

    const socket = net.createConnection();

    socket.on('error', (err) => this._onError(err));
    socket.on('close', (err) => this._onClose(err));
    socket.on('connect', () => this._onConnect());
    socket.on('data', dataHandler.handle(socket, (message) => this._onMessage(socket, message)));

    socket.setEncoding('utf-8')
      .setKeepAlive(true, 30000)
      .setNoDelay(true);

    this[SOCKET$] = socket;
  }

  /**
   *
   * @param source
   * @param target
   * @param handler
   * @returns {Node}
   */
  static *create(source, target, handler) {
    const node = new Node(target.host, target.port);
    node.setMessageHandler(handler);
    yield node.connect();

    const request = Request.create('handshake', {
      host: source.host,
      port: source.port,
      info: {
        type: source.type
      }
    });

    const response = yield request.send(node.getSocket());
    _.extend(node.info, response);

    return node;
  }

  /**
   *
   * @param err
   * @private
   */
  _onError(err) {
    console.error(err);
  }

  /**
   *
   * @private
   */
  _onClose() {
    //console.error('close');
    this.connectionFailureCount = 0;

    const reconnect = R.bind(this._reconnect, this);
    const timeout = this._getReconnectTimeout(this.connectionFailureCount++);

    setTimeout(reconnect, timeout).unref();
  }

  _reconnect() {
    this.connect();
  }

  /**
   *
   * @private
   */
  _onConnect() {
    //console.error('node connect');
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

  _onMessage(socket, message) {
    console.log(`unhandled node message`, message);
  }

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

    return new Promise((resolve, reject) => {
      this[SOCKET$].connect(connectionOptions, function (err) {
        //console.error('connect callback', err);
        utils.callbackToPromise(resolve, reject)(err);
      });
    });
  }

  /**
   *
   * @returns {Socket}
   */
  getSocket() {
    return this[SOCKET$];
  }
};