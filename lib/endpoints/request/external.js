'use strict';

const callbacks = require('./../../callbacks');

module.exports = function *(data, socket, node) {
  let callback = callbacks.create();

  console.log(callback.id, data);

  node.emit('message', {
    id: callback.id,
    data
  });

  return yield callback;
};