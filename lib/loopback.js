'use strict';

const INCP$ = Symbol()

module.exports = class Loopback {
  constructor(incp) {
    this[INCP$] = incp;
  }
  
  request(data, timeout = 3000) {
    return this[INCP$].onRequest(data);
  }

  push(data) {
    return this[INCP$].onPush(data);
  }
}
