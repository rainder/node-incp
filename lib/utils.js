'use strict';

const version = require('./../package.json').version;

module.exports = {
  pipeEvents,
  versionToNumber,
  proto,
  cleanupData,
};

/**
 *
 * @param eventName
 * @param source
 * @param destination
 */
function pipeEvents(eventName, source, destination) {
  source.on(eventName, (...args) => destination.emit(eventName, ...args));
}

/**
 *
 * @param version
 * @returns {*}
 */
function versionToNumber(version) {
  return version
    .split('-')[0]
    .split('.')
    .reduce(reduce, 0);

  /**
   *
   * @param result
   * @param value
   * @param index
   * @returns {*}
   */
  function reduce(result, value, index) {
    if (index === 2) {
      return result;
    }

    return result + (value * (Math.pow(1000, (1 - index))));
  }
}

/**
 *
 * @param base
 * @returns {Buffer}
 */
function proto(...base) {
  const buffer = new Buffer(base);
  const versionNumber = versionToNumber(version);

  buffer.writeInt32BE(buffer.readInt32BE(0) + versionNumber, 0);

  return buffer;
}

/**
 *
 * @param data
 */
function cleanupData(data) {
  return JSON.parse(JSON.stringify(data));
}
