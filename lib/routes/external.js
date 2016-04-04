'use strict';

const co = require('co');
const utils = require('./../utils');

module.exports = function *(data) {
  return yield new Promise((resolve, reject) => {
    co(this.ic.messageHandler(data)).then(resolve, reject);
  });
};