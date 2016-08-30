'use strict';

const net = require('net');

const SOCKET$ = Symbol();
const CONNECTION_PROMISE$ = Symbol();

module.exports = class Client {
  /**
   *
   * @param host
   * @param port
   */
  constructor(host, port) {
    this[CONNECTION_PROMISE$] = {};
    this[CONNECTION_PROMISE$].promise = new Promise((resolve, reject) => {
      this[CONNECTION_PROMISE$].resolve = resolve;
      this[CONNECTION_PROMISE$].reject = reject;
    });

    this[SOCKET$] = net.connect({
      host: host,
      port: port
    });

    this[SOCKET$].on('close', () => this._close());
    this[SOCKET$].once('connect', () => this._connect());
    this[SOCKET$].once('error', (err) => this._error(err));
  }

  /**
   *
   * @param err
   * @private
   */
  _error(err) {
    this[CONNECTION_PROMISE$].reject(err);
    this._close();
  }

  /**
   *
   * @private
   */
  _close() {
    this[SOCKET$].removeAllListeners();
  }

  /**
   *
   * @private
   */
  _connect() {
    this[CONNECTION_PROMISE$].resolve();
  }

  /**
   *
   */
  close() {
    this[SOCKET$].end();
  }

  /**
   *
   * @returns {Promise}
   */
  waitForConnection() {
    return this[CONNECTION_PROMISE$].promise;
  }

  /**
   *
   * @returns {*}
   */
  getSocket() {
    return this[SOCKET$];
  }
}
