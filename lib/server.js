'use strict';

const R = require('ramda');
const net = require('net');

const utils = require('./utils');
const dataHandler = require('./data-handler');

const SERVER$ = Symbol();

module.exports = class Server {
  constructor(host, port) {
    this.host = host;
    this.port = port;

    const server = new net.Server();

    server.on('connection', R.bind(this._onConnection, this));
    server.on('error', R.bind(this._onError, this));

    this[SERVER$] = server;
  }

  /**
   *
   * @param socket
   * @private
   */
  _onConnection(socket) {
    console.log('INCP Server connection established');

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
    console.log('INCP Unhandled server message', message);
  }

  /**
   *
   * @param socket
   * @private
   */
  _onClose(socket) {
    console.error(`INCP Server connection closed`);
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