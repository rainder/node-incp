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
    return this[$INCP].onRequest(utils.cleanupData(data));
  }

  /**
   *
   * @param data
   * @returns {Promise}
   */
  push(data) {
    return this[$INCP].onPush(utils.cleanupData(data));
  }
}

module.exports = Loopback;
