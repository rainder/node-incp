'use strict';

const callbacks = require('app/callbacks');

module.exports = function *(data, socket) {
  let callback = callbacks.create();

  const node = this.app.socketNodeMap.get(socket);

  this.app.emit('message', {
    id: callback.id,
    data
  }, node);

  return yield callback;
};