'use strict';

const callbacks = require('./../../callbacks');

module.exports = function *(data, socket) {
  //const node = socketNodeMap.get(socket);
  const node = this.app.socketNodeMap.get(socket);

  if (!node) {
    //setTimeout(function () {
    //  console.error(!!socketNodeMap.get(socket), '<<<<<<<<<<<<');
    //}, 1000);

    //console.error(data, socket);
    throw new Error('Node could not be found');
  }

  this.app.emit('message', {
    data: data
  }, node);
};