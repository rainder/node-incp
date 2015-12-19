'use strict';

const callbacks = require('./../../callbacks');

module.exports = function *(data, socket, node) {
  let callback = callbacks.create();

  node.emit('message', data, respond);

  return yield callback;

  function respond(err, data) {
    if (err) {
      return callbacks.execute(callback.id, false, err);
    }
    return callbacks.execute(callback.id, true, data);
  }
};