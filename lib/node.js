'use strict';

const co = require('co');
const microtime = require('microtime');

const $SOCKET = Symbol();

class Node {
  constructor(configuration, socket, is_client) {
    this.configuration = configuration;
    this.is_client = is_client;
    this[$SOCKET] = socket;
  }

  /**
   *
   * @returns {*}
   */
  getSocket() {
    return this[$SOCKET];
  }

  /**
   *
   * @returns {Configuration}
   */
  getConfiguration() {
    return this.configuration;
  }

  /**
   *
   * @returns {*}
   */
  close() {
    const socket = this.getSocket();

    return co(function *() {
      socket.end();
    });
  }

  /**
   *
   * @returns {Promise.<TResult>}
   */
  ping() {
    const now = microtime.now();

    return this.getSocket().dataHandler.request({
      method: 'ping',
    }, { timeout: 30000 }).then(() => {
      return (microtime.now() - now) / 1000;
    });
  }

  /**
   *
   * @param data {Object}
   * @returns {Promise.<TResult>}
   */
  request(data) {
    return this[$SOCKET].dataHandler.request({
      method: 'external',
      data,
    }, { timeout: 30000 });
  }

  /**
   *
   * @param data
   * @returns {Promise.<TResult>}
   */
  push(data) {
    return this[$SOCKET].dataHandler.push({
      method: 'external',
      data,
    });
  }
};

module.exports = Node;
