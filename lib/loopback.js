'use strict';

const ICRequest = require('./message/ic-request');
const ICResponse = require('./message/ic-response');

module.exports = class Loopback {
  constructor(incp, options) {
    this.incp = incp;
    this.options = options;
    
    options.remote = {};
    options.local = {};
    this.remote_config = {};
  }

  /**
   * 
   * @returns {{write: (function())}}
   */
  getSocket() {
    return {
      write: (data, cb) => {
        const request = ICRequest.createFromIncoming(JSON.parse(data));
        cb();

        this.options.requestHandler({
          write: (data, cb) => {
            ICResponse.createFromIncoming(JSON.parse(data)).deliver();
            cb();
          }
        }, request);
      }
    };
  }
  
  *send(data) {
    const r = yield this.incp._onMessage(data);
    console.log(r);
  }

  /**
   * 
   */
  *shutdown() {

  }
}