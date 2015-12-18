'use strict';

const callbacks = require('./../../callbacks');

module.exports = function *(data, socket, node) {
  //const node = socketNodeMap.get(socket);
  if (!node) {
    //setTimeout(function () {
    //  console.error(!!socketNodeMap.get(socket), '<<<<<<<<<<<<');
    //}, 1000);

    //console.error(data, socket);
    throw new Error('Node could not be found');
  }

  node.emit('message', {
    data: data
  }, node);
};