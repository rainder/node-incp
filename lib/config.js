'use strict';

const _ = require('lodash');
const bson = require('bson');

module.exports = class Config {
  constructor(options = {}) {
    this.id = bson.ObjectID().toString();
    this.options = _.defaults(options, {
      host: '0.0.0.0',
      port: 0,
      group: 'default'
    });
  }

  getId() {
    return this.id;
  }

  getOptions() {
    return this.options;
  }
}
