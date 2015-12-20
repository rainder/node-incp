'use strict';

const callbacks = require('./../../callbacks');

module.exports = function *(data, socket, node) {
  node.emit('message', data);
};