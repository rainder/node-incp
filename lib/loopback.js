'use strict';

const INCP$ = Symbol()

module.exports = class Loopback {
  /**
   * 
   * @param incp
   */
  constructor(incp) {
    this[INCP$] = incp;
  }

  /**
   * 
   * @param data
   * @param timeout
   * @returns {Promise.<TResult>|*}
   */
  request(data, timeout = 3000) {
    return this[INCP$].onRequest(data);
  }

  /**
   * 
   * @param data
   * @returns {*}
   */
  push(data) {
    return this[INCP$].onPush(data);
  }
}
