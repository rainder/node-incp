'use strict';

const q = require('q');
const _ = require('lodash');
const net = require('net');
const util = require('util');
const events = require('events');

const dataHandler = require('app/data-handler');
const utils = require('app/utils');
const callbacks = require('app/callbacks');

module.exports = Client;

function Client(host, port) {
  this.id = null;
  this.host = host;
  this.port = port;
  this.socket = new net.Socket();
  this.connected = false;

  this.socket.on('error', (err) => this._handleError(err));
  this.socket.on('close', () => this._handleClose());
  this.socket.on('data', (data) => this._handleData(this.socket, data));
  this.socket.on('connect', () => this._handleConnection(this.socket));
}

util.inherits(Client, events.EventEmitter);

_.extend(Client.prototype, {
  _handleConnection,
  _handleError,
  _handleClose,
  _handleData: dataHandler.incoming,
  connect,
  setId,
  //destroy
});

/**
 *
 * @private
 */
function _handleError(err) {
  console.log('Client error:', err.message);
  setTimeout(() => {
    this.socket.connect({
      host: this.host,
      port: this.port
    });
  }, 1000);
}

/**
 *
 * @private
 */
function _handleClose() {
  //console.error('client connection -', this.host, this.port);
}

/**
 *
 * @param socket
 * @private
 */
function _handleConnection(socket) {
  socket.setEncoding('utf-8');
  //console.error('client connection +', this.host, this.port);
}

/**
 *
 * @returns {*|promise}
 */
function connect() {
  const dfd = q.defer();
  const options = {
    host: this.host,
    port: this.port
  };

  this.socket.connect(options, utils.callbackToDefer(dfd));

  dfd.promise.then(() => {
    this.connected = true;
  });

  return dfd.promise;
}

/**
 *
 * @param id
 */
function setId(id) {
  this.id = id;
}