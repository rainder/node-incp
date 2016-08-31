'use strict';

const tryCatch = require('co-try-catch');

module.exports = function *(body, incp) {
  yield body.nodes.map(nodeInfo => {
    return tryCatch(incp.connectTo(nodeInfo.host, nodeInfo.port));
  });
};
