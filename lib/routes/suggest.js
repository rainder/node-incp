'use strict';

const co = require('co');

module.exports = function *(data) {
  const self = this;


  // co(function *() {
    for (let server of data.servers) {
      if (!self.incp.nodes.has(server.id)) {
        const host = server.host;
        const port = server.port;

        if (self.incp.server.host === host && self.incp.server.port === port) {
          continue;
        }

        yield self.incp.connectTo({ host, port });
      }
    }
  // });

  return {};
};