'use strict';

const bson = require('bson');

module.exports = class Config {
  /**
   *
   * @param options
   */
  constructor(options = {}) {
    this.id = bson.ObjectID().toString();
    this.metadata = options.metadata || {};
    this.options = {
      host: options.host || '0.0.0.0',
      port: options.port || 0,
      group: options.group || 'default'
    };
  }

  /**
   *
   * @returns {String}
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @returns {{host, port, group}}
   */
  getOptions() {
    return this.options;
  }

  /**
   * 
   * @param key
   * @param value
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * 
   * @returns {*}
   */
  getMetadata() {
    return this.metadata;
  }
}
