'use strict';

const bson = require('bson');

module.exports = class Config {
  /**
   *
   * @param options
   */
  constructor(options = {}) {
    this.id = bson.ObjectID().toString();
    this.options = {
      host: options.host || '0.0.0.0',
      port: options.port || 0,
      group: options.group || 'default',
      metadata: options.metadata || {}
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
    this.options.metadata[key] = value;
  }

  /**
   * 
   * @returns {*}
   */
  getMetadata() {
    return this.options.metadata;
  }
}
