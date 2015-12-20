'use strict';

const q = require('q');
const _ = require('lodash');
const net = require('net');
const debug = require('debug');
const events = require('events');
const utils = require('./utils');

const SOCKET$ = Symbol();

module.exports = class Client extends events.EventEmitter {

  /**
   *
   * @param host
   * @param port
   */
  constructor(host, port) {
    super();

    this.connectionOptions = { host, port };
    this.reconnect = true;
    this.d = debug('intercon:client');
    this.numberOfFailedConnectionAttempts = 0;
    this[SOCKET$] = new net.Socket();

    this[SOCKET$].on('error', (err) => this._handleError(err));
    this[SOCKET$].on('close', () => this._handleClose());
    this[SOCKET$].on('connect', () => this._handleConnection(this[SOCKET$]));

    this.d('init', this.connectionOptions);
  }

  /**
   *
   * @private
   */
  _handleError() {
  }

  /**
   *
   * @private
   */
  _handleClose() {
    this.d(`Closed connection to ${this.connectionOptions.host}:${this.connectionOptions.port}`);

    this.numberOfFailedConnectionAttempts++;
    setTimeout(() => {
      if (!this.reconnect) {
        return;
      }
      this[SOCKET$].connect(this.connectionOptions);
    }, this._getReconnectTimeout()).unref();
  }

  /**
   *
   * @param socket
   * @private
   */
  _handleConnection(socket) {
    socket
      .setEncoding('utf-8')
      .setKeepAlive(true, 30000)
      .setNoDelay(true);

    this.d(`Connected to ${this.connectionOptions.host}:${this.connectionOptions.port}`);
    this.numberOfFailedConnectionAttempts = 0;
  }

  /**
   *
   * @returns {number}
   * @private
   */
  _getReconnectTimeout() {
    return Math.min(5000, Math.pow(this.numberOfFailedConnectionAttempts, 2) * 2 + 100);
  }

  /**
   *
   * @returns {*}
   */
  getSocket() {
    return this[SOCKET$];
  }

  /**
   *
   * @returns {*}
   */
  connect() {
    const dfd = q.defer();

    this[SOCKET$].connect(this.connectionOptions, utils.callbackToDefer(dfd));

    return dfd.promise;
  }

  /**
   *
   */
  close() {
    this.d('close', this.connectionOptions);
    this.reconnect = false;
    this[SOCKET$].unref();
    try {
      this[SOCKET$].destroy();
    } catch (e) {
    }
  }
};
