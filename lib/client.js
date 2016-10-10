'use strict';

const net = require('net');
const defer = require('@rainder/defer');

const SOCKET$ = Symbol();
const CONNECTION_PROMISE$ = Symbol();

module.exports = class Client {
  /**
   *
   * @param host
   * @param port
   */
  constructor(host, port) {
    const connectionDfd = defer();
    const socketOptions = {
      host: host,
      port: port,
      allowHalfOpen: false,
    };
    
    this[CONNECTION_PROMISE$] = connectionDfd.promise;
    this[SOCKET$] = net.connect(socketOptions);

    this[SOCKET$].once('connect', connectionDfd.resolve);
    this[SOCKET$].once('error', connectionDfd.reject);

    this[SOCKET$].setNoDelay(true).setKeepAlive(true, 60000);
  }

  /**
   * 
   * @param host
   * @param port
   * @returns {Promise}
   */
  static create(host, port, dataHandler) {
    const client = new Client(host, port);

    dataHandler.init(client.getSocket());
    
    return client.waitForConnection().then(() => client);
  }

  /**
   *
   * @returns {Promise}
   */
  waitForConnection() {
    return this[CONNECTION_PROMISE$];
  }

  /**
   *
   * @returns {*}
   */
  getSocket() {
    return this[SOCKET$];
  }
};
