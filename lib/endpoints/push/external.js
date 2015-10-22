'use strict';

const callbacks = require('app/callbacks');

module.exports = function *(data, socket) {
  const node = this.app.socketNodeMap.get(socket);
  this.app.emit('message', {
    data: data
  }, node);
};