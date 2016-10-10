'use strict';

const INCP$ = Symbol();

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
   * @returns {Promise.<TResult>|*}
   */
  request(data) {
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
};
