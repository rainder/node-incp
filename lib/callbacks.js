'use strict';

const objectid = require('objectid');
const q = require('q');
const map = new Map();

module.exports = {
  _map: map,
  create,
  execute
};

/**
 *
 * @param (id)
 * @param (timeout) default 30000
 * @returns {*|promise}
 */
function create(id, timeout) {
  timeout = timeout || 30000;
  id = id || objectid().toString();

  const dfd = q.defer();
  const err = new Error(`callback timeout ${id}`);

  map.set(id, dfd);
  dfd.promise.id = id;

  dfd.promise.timeout = setTimeout(() => {
    map.delete(id);
    dfd.reject(err);
  }, timeout).unref();

  return dfd.promise;
}

/**
 *
 * @param id
 * @param success {boolean}
 * @param data
 * @returns {boolean}
 */
function execute(id, success, data) {
  const dfd = map.get(id);
  if (!dfd) {
    console.error(`callback could not be found`, success, data);
    return false;
  }

  map.delete(id);
  clearTimeout(dfd.promise.timeout);

  dfd[success ? 'resolve': 'reject'](data);

  return true;
}