'use strict';

const net = require('net');

const utils = require('./utils');
const dataHandler = require('./data-handler');
const debug = require('debug');
const d = debug('incp:server');

const SERVER$ = Symbol();

module.exports = class Server {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.shutdown = false;

    const server = new net.Server();

    server.on('connection', (socket) => this._onConnection(socket));
    server.on('error', (err) => this._onError(err));

    this[SERVER$] = server;
  }

  /**
   *
   * @param socket
   * @private
   */
  _onConnection(socket) {
    d('Server connection established');

    if (this.shutdown) {
      socket.close();
      return true;
    }

    socket
      .setEncoding('utf-8')
      .setKeepAlive(true, 30000)
      .setNoDelay(true);

    socket.on('data', dataHandler.handle((message) => this._onMessage(socket, message)));
    socket.on('close', this._onClose.bind(this, socket));
  }

  /**
   *
   * @param err
   * @private
   */
  _onError(err) {
    console.error(`INCP Server error:`, err.message);
  }

  /**
   *
   * @param socket
   * @param message
   * @private
   */
  _onMessage(socket, message) {
    console.error('INCP Unhandled server message', message);
  }

  /**
   *
   * @param socket
   * @private
   */
  _onClose(socket) {
    d(`INCP Server connection closed`);
  }

  /**
   *
   * @param handler
   * @returns {Server}
   */
  setMessageHandler(handler) {
    this._onMessage = handler;
    return this;
  }

  /**
   *
   * @returns {*}
   */
  getServer() {
    return this[SERVER$];
  }

  close() {
    this.shutdown = true;
    this[SERVER$].unref();
    this[SERVER$].close();
  }

  /**
   *
   * @returns {Promise}
   */
  listen() {
    const options = {
      host: this.host,
      port: this.port,
      excludive: true
    };

    return new Promise((resolve, reject) => {
      this[SERVER$].listen(options, utils.callbackToPromise(resolve, reject));
    });
  }
};