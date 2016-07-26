'use strict';

const PACKAGE_JSON = require('./../../package.json');

module.exports = function *(data) {
  return {
    protocol: 'incp',
    id: this.incp.id,
    config: this.incp.config,
    version: PACKAGE_JSON.version
  };
};