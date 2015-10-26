'use strict';

const q = require('q');
const _ = require('lodash');
const net = require('net');
const util = require('util');
const events = require('events');
const debug = require('debug')('intercon:server');

const dataHandler = require('app/data-handler');
const utils = require('app/utils');

module.exports = Server;

function Server(options) {
  this.type = options.type;
  this.name = options.name;
  this.host = options.host;
  this.port = options.port;
  this.startup = null;
  this.server = new net.Server();
  this.sockets = new Set();

  this.server.on('connection', (connection) => this._handleConnection(connection));
  this.server.on('error', (error) => this._handleError(error));
  this.server.on('listening', (error) => debug(`listening on ${this.host}:${this.port}`));
}

util.inherits(Server, events.EventEmitter);

_.extend(Server.prototype, {
  _handleConnection,
  _handleError,
  _handleData: dataHandler.incoming,
  _handleClose,
  listen,
  destroy
});

/**
 *
 * @private
 */
function _handleError() {
  console.log(arguments);
}

/**
 *
 * @param socket
 * @private
 */
function _handleConnection(socket) {
  socket.setEncoding('utf-8');
  this.sockets.add(socket);

  debug(`Received connection from ${socket.remoteAddress}:${socket.remotePort}`);

  //console.error('server connection +');

  socket.on('data', (data) => this._handleData(socket, data));
  socket.on('destroy', () => this._handleClose(socket));
}

/**
 *
 * @param socket
 * @private
 */
function _handleClose(socket) {
  this.sockets.delete(socket);
  //console.error('server connection -');
}

/**
 *
 * @returns {*|promise}
 */
function destroy() {
  let dfd = q.defer();

  this.server.unref();
  this.server.close(dfd.resolve);

  for (let socket of this.sockets) {
    socket.destroy();
  }

  return dfd.promise;
}

/**
 *
 * @returns {*|promise}
 */
function listen() {
  let dfd = q.defer();
  let options = {
    host: this.host,
    port: this.port,
    exclusive: true
  };

  this.server.listen(options, (err) => {
    utils.callbackToDefer(dfd)(err);
    this.startup = new Date();
    console.log(`Server is listening on ${this.host}:${this.port}`);
  });

  return dfd.promise;
}