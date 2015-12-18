'use strict';

const q = require('q');
const _ = require('lodash');
const net = require('net');
const util = require('util');
const events = require('events');
const debug = require('debug')('intercon:server');

const dataHandler = require('./data-handler');
const utils = require('./utils');

const SERVER$ = Symbol();

module.exports = class Server extends events.EventEmitter {
  constructor(options) {
    super();
    this.type = options.type;
    this.name = options.name;
    this.host = options.host;
    this.port = options.port;
    this.startup = null;

    this[SERVER$] = new net.Server();

    this[SERVER$].on('connection', (socket) => this._handleConnection(socket));
    this[SERVER$].on('error', this.emit.bind('error'));
    this[SERVER$].on('listening', this.emit.bind('listening'));
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
      utils.callbackToDefer(dfd)(err);
      this.startup = new Date();
      debug(`Server is listening on ${this.host}:${this.port}`);
    });

    return dfd.promise;
  }

  /**
   *
   * @param socket
   * @private
   */
  _handleConnection(socket) {
    socket.setEncoding('utf-8');

    debug(`Received connection from ${socket.remoteAddress}:${socket.remotePort}`);
    printConnectionsCount(this[SERVER$]);
    this.emit('connection', socket);

    socket.on('close', () => {
      debug(`Closed connection from ${socket.remoteAddress}:${socket.remotePort}`);
      printConnectionsCount(this[SERVER$]);
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