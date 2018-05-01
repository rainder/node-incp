'use strict';

const { measure } = require('@rainder/measure');

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
  async close() {
    const socket = this.getSocket();

    socket.end();
  }

  /**
   *
   * @returns {Promise.<TResult>}
   */
  ping() {
    const ms = measure();

    return this.getSocket().dataHandler.request({
      method: 'ping',
    }, { timeout: 30000 }).then(() => {
      return ms();
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
