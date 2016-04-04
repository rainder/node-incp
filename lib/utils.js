'use strict';

module.exports = {
  callbackToDefer,
  callbackToPromise
};

/**
 *
 * @param dfd
 * @returns {Function}
 */
function callbackToDefer(dfd) {
  return function (err, data) {
    if (err) {
      dfd.reject(err);
    } else {
      dfd.resolve(data);
    }
  }
}

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