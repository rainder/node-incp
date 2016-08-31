'use strict';

module.exports = function *(body, incp, socket) {
  const node = findNode(incp, socket);
  
  for (let key of Object.keys(body.metadata)) {
    const value = body.metadata[key];
    node.metadata[key] = value;

    incp.emit('metadata', key, value, node);
  }

};

/**
 * 
 * @param incp
 * @param socket
 * @returns {V|T|*}
 */
function findNode(incp, socket) {
  for (let node of incp.getNodes().values()) {
    if (node.getSocket() === socket) {
      return node;
    }
  }
}
