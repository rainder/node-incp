'use strict';

const tryCatch = require('co-try-catch');

module.exports = function *(body, incp, connection) {
  for (let nodeInfo of body.nodes) {
    yield tryCatch(incp.connectTo(nodeInfo.host, nodeInfo.port));
  }
};
