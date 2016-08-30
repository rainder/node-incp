'use strict';

const co = require('co');
const Node = require('./../../node');
const INCPError = require('./../../incp-error');

module.exports = function *(body, incp, connection) {
  const result = {
    id: incp.config.getId(),
    port: incp.config.getOptions().port
  };

  if (incp.getNodes().has(body.id)) {
    throw new INCPError.ALREADY_CONNECTED(result);
  }

  if (incp.config.getOptions().group !== body.group) {
    throw new INCPError.GROUP_MISMATCH(`expected ${incp.config.getOptions().group}`);
  }

  const node = new Node(incp.dataHandler, incp.config, connection, false);
  node.id = body.id;
  node.port = body.port;
  incp.getNodes().set(body.id, node);
  connection.once('close', () => {
    incp.getNodes().delete(body.id);
  });

  co(function *() {
    for (let relativeNode of incp.getNodes().values()) {
      if (node === relativeNode) {
        continue;
      }

      yield relativeNode._introduce(node);
    }
  });

  return result;
};
