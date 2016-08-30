'use strict';

/**
 * 
 */
class INCPError {
  /**
   * 
   * @param errno
   * @param message
   * @param info
   */
  constructor(errno, message, info) {
    this.errno = errno;
    this.message = message;
    this.info = info;
  }
}

/**
 * 
 * @param errno
 * @param message
 * @returns {{new(*=): {}, errno: (function()), new(*, *, *): {}}}
 */
function bind(errno, message) {
  return class extends INCPError {
    constructor(info) {
      super(errno, message, info);
    }
    
    static errno() {
      return errno;
    }
  };
}

module.exports = {
  ALREADY_CONNECTED: bind(1, 'Already connected'),
  GROUP_MISMATCH: bind(2, 'Group mismatch'),
  INVALID_ENDPOINT: bind(3, 'Invalid endpoint'),
};
