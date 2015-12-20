'use strict';

const _ = require('lodash');
const q = require('q');
const net = require('net');
const util = require('util');
const events = require('events');
const debug = require('debug');
const utils = require('./utils');

const d = debug('intercon:server');
const SERVER$ = Symbol();

module.exports = class Server extends events.EventEmitter {
  /**
   *
   * @param options
   */
  constructor(options) {
    super();
    this.type = options.type;
    this.name = options.name;
    this.host = options.host;
    this.port = options.port;
    this.connections = new Set();
    this.startup = null;

    this[SERVER$] = new net.Server();

    this[SERVER$].on('connection', (socket) => this._handleConnection(socket));
    this[SERVER$].on('error', (err) => this._handleError(err));
  }

  /**
   *
   * @returns {*}
   */
  listen() {
    const dfd = q.defer();
    const options = {
      host: this.host,
      port: this.port,
      exclusive: true
    };
    
    this[SERVER$].listen(options, (err) => {
      const address = this[SERVER$].address();

      utils.callbackToDefer(dfd)(err);
      this.startup = new Date();

      d(`Server is listening on ${address.host}:${address.port}`);
    });

    return dfd.promise;
  }

  /**
   *
   * @param err
   * @private
   */
  _handleError(err) {
    console.error('Intercon Server:', err);
  }

  /**
   *
   * @param socket
   * @private
   */
  _handleConnection(socket) {
    socket.setEncoding('utf-8');
    this.connections.add(socket);

    d(`Received connection from ${socket.remoteAddress}:${socket.remotePort}`);
    //printConnectionsCount(this[SERVER$]);
    this.emit('connection', socket);

    socket.on('close', () => {
      d(`Closed connection from ${socket.remoteAddress}:${socket.remotePort}`);
      //printConnectionsCount(this[SERVER$]);
      this.connections.delete(socket);
    });
  }

  close() {
    return new Promise((resolve) => {
      for (let socket of this.connections.values()) {
        socket.close();
      }

      this[SERVER$].unref();
      this[SERVER$].close(resolve);
    });
  }

  /**
   *
   * @param cb
   */
  getConnections() {
    return (cb) => {
      this[SERVER$].getConnections(cb);
    };
  }
};

function printConnectionsCount(server) {
  server.getConnections(function (err, data) {
    console.log('NUMBER OF SERVER CONNECTIONS', data);
  });
}