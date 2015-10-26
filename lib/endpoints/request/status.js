'use strict';

const utils = require('app/utils');
const os = require('os');

module.exports = function *(data, socket) {
  let nodes = [];

  for (let node of this.app.mapById.values()) {
    nodes.push(utils.toPublicId(node.info));
  }

  let numberOfServerConnections = yield (cb) => {
    this.app.server.server.getConnections(cb);
  };

  return {
    id: utils.toPublicId(this.app.options),
    h: os.hostname(),
    l: os.loadavg(),
    pid: process.pid,
    nodes,
    number_of_server_connections: numberOfServerConnections
  };
};