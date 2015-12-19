'use strict';

const objectid = require('objectid');
const q = require('q');
const _ = require('lodash');
const map = new Map();

module.exports = {
  _map: map,
  create,
  execute
};

/**
 *
 * @param (id)
 * @returns {*|promise}
 */
function create(id) {
  const dfd = q.defer();
  id = id || objectid().toString();

  let err = new Error(`timeout ${id}`);
  dfd.promise.id = id;

  map.set(id, dfd);

  dfd.promise.timeout = setTimeout(function () {
    map.delete(id);
    dfd.reject(err);
  }, 30000).unref();

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
    console.error('callback could not be found');
    return false;
  }

  map.delete(id);
  clearTimeout(dfd.promise);

  if (success) {
    dfd.resolve(data);
  } else {
    //console.error(new Error().stack, id, data);
    dfd.reject(data);
  }

  return true;
}