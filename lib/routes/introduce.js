'use strict';

module.exports = function *(data) {
  let created = false;

  if (!this.incp.nodes.has(data.id)) {
    const host = this.socket.remoteAddress;
    const port = data.port;

    yield this.incp.connectTo({ host, port });
    created = true;
  }

  return { created };
};