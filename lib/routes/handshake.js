'use strict';

const os = require('os');
const PACKAGE_JSON = require('./../../package.json');

module.exports = function *(data) {
  return {
    protocol: 'incp',
    id: this.incp.id,
    config: this.incp.config,
    hostname: os.hostname(),
    version: PACKAGE_JSON.version
  };
};