'use strict';

module.exports = function *(data, socket, node) {
  console.log('SHUTDOWN');

  node.close();
  console.log(node.manager.mapById.delete(node.getClientCfg().id));


  return true;
};