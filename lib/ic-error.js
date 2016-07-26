'use strict';

/**
 *
 * @param errno
 * @param message
 * @param info
 * @constructor
 */
function ICError(errno, message, info) {
  this.errno = errno;
  this.message = message;
  this.info = info;
}

/**
 *
 * @param a
 * @param b
 * @returns {function(this:ICError)}
 */
function bind(a, b) {
  return ICError.bind(ICError, a, b);
}

module.exports = {
  VALIDATION_FAILURE: bind(1, 'Validation failure'),
  INCOMPATIBLE_VERSIONS: bind(2, 'Incompatible versions'),
  INVALID_PROTOCOL: bind(3, 'Invalid protocol'),
  NODE_NOT_FOUND: bind(10, 'Node could not be found')
};