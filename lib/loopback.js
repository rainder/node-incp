'use strict';

const utils = require('./utils');

const $INCP = Symbol();

class Loopback {
  /**
   *
   * @param incp
   */
  constructor(incp) {
    this[$INCP] = incp;
  }

  /**
   *
   * @param data
   * @returns {Promise.<*>}
   */
  request(data) {
    return this[$INCP].onRequest(utils.cleanupData(data))
      .then((result) => utils.cleanupData(result))
      .catch((err) => Promise.reject(utils.cleanupData(err)));
  }

  /**
   *
   * @param data
   * @returns {Promise}
   */
  push(data) {
    return this[$INCP].onPush(utils.cleanupData(data));
  }

  /**
   *
   * @returns {Promise.<number>}
   */
  ping() {
    return Promise.resolve(0);
  }

  /**
   *
   * @returns {Configuration}
   */
  getConfiguration() {
    return this[$INCP].getConfiguration();
  }

  /**
   *
   * @returns {Promise.<T>}
   */
  close() {
    return Promise.resolve();
  }
}

module.exports = Loopback;
