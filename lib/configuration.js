'use strict';

const events = require('events');
const bson = require('bson');

class Configuration extends events.EventEmitter {

  /**
   *
   * @param id
   * @param host
   * @param port
   * @param group
   * @param metadata
   * @param os
   */
  constructor({ id, host, port, group, metadata, os }) {
    super();

    this.id = id || new bson.ObjectID(undefined).toString();
    this.host = host || '0.0.0.0';
    this.port = port || 0;
    this.group = group || 'default';
    this.os = os || {};
    this.metadata = metadata || {};
  }

  getId() {
    return this.id;
  }

  /**
   *
   * @returns {string}
   */
  getHost() {
    return this.host;
  }

  /**
   *
   * @returns {number}
   */
  getPort() {
    return this.port;
  }

  /**
   *
   * @returns {string}
   */
  getGroup() {
    return this.group;
  }

  /**
   *
   * @returns {*|{}}
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   *
   * @returns {*}
   */
  getMetadataValue(key) {
    return this.metadata[key];
  }

  /**
   *
   * @returns {*}
   */
  getOs() {
    return this.os;
  }

  /**
   *
   * @param host {String}
   * @returns {Configuration}
   */
  setHost(host) {
    this.host = host;

    return this;
  }

  /**
   *
   * @param port {Number}
   * @returns {Configuration}
   */
  setPort(port) {
    this.port = port;

    return this;
  }

  /**
   *
   * @param key
   * @param value
   * @returns {Configuration}
   */
  setMetadataValue(key, value) {
    this.metadata[key] = value;
    this.emit('change', `metadata.${key}`);

    return this;
  }
}

module.exports = Configuration;
