'use strict';

const Node = require('./../../node');
const INCPError = require('./../../incp-error');

module.exports = function *(body, incp, socket) {
  const result = {
    id: incp.config.getId(),
    port: incp.config.getOptions().port,
    metadata: incp.config.getMetadata()
  };

  if (incp.getNodes().has(body.id)) {
    // if (incp.getId() > body.id) {
      throw new INCPError.ALREADY_CONNECTED(result);
    // }
  }

  if (incp.config.getOptions().group !== body.group) {
    throw new INCPError.GROUP_MISMATCH(`expected ${incp.config.getOptions().group}`);
  }

  const node = Node.createFromServerSocket(incp.getDataHandler(), socket, body);
  incp._registerNode(node);
  
  yield node._introduce(incp.getNodes().values());

  return result;
};
