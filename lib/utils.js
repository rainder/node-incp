'use strict';

const debug = require('debug');

module.exports = {
  callbackToPromise,
};

/**
 *
 * @param resolve
 * @param reject
 * @returns {Function}
 */
function callbackToPromise(resolve, reject) {
  return function (err, data) {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  };
}