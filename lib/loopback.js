'use strict';

module.exports = class Loopback {
  /**
   *
   * @param ic
   */
  constructor(ic) {
    this.ic = ic;
  }

  /**
   *
   * @param payload
   * @returns {*}
   */
  send(payload) {
    return this.ic._onExternalMessage(JSON.parse(JSON.stringify(payload)));
  }
};