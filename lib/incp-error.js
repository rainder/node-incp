'use strict';

class BaseINCPError {
  constructor(errno, message, info) {
    this.type = 'INCPError';
    this.errno = errno;
    this.message = message;
    this.info = info;
  }

  /**
   *
   * @param errno
   * @param message
   * @returns {INCPErrorConstructor}
   */
  static create(errno, message) {
    return class INCPError extends BaseINCPError {
      constructor(info) {
        super(errno, message, info);
      }

      /**
       *
       * @returns {*}
       */
      static errno() {
        return errno;
      }

      /**
       *
       * @returns {*}
       */
      static message() {
        return message;
      }
    };
  }
}

module.exports = BaseINCPError;

BaseINCPError.INVALID_PROTO = BaseINCPError.create(1, 'Invalid proto');
BaseINCPError.INVALID_ENDPOINT = BaseINCPError.create(2, 'Invalid endpoint');
BaseINCPError.ALREADY_CONNECTED = BaseINCPError.create(3, 'Already connected');
BaseINCPError.TAKING_CONNECTION_OWNERSHIP = BaseINCPError.create(4, 'Taking connection ownership');
BaseINCPError.GROUP_MISMATCH = BaseINCPError.create(5, 'Group mismatch');
BaseINCPError.LOOPBACK_CONNECTION = BaseINCPError.create(6, 'Loopback connection');
BaseINCPError.HOST_BLACLISTED = BaseINCPError.create(7, 'Host blacklisted');
BaseINCPError.LOCAL_SHUTTING_DOWN = BaseINCPError.create(8, 'Local INCP is shutting down');
