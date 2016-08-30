'use strict';

const tryCatch = require('co-try-catch');

module.exports = function *(body, incp, connection) {
  yield body.nodes.map(nodeInfo => {
    return tryCatch(incp.connectTo(nodeInfo.host, nodeInfo.port));
  })
};
