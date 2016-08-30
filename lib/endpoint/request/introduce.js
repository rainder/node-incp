'use strict';

const tryCatch = require('co-try-catch');

module.exports = function *(body, incp, connection) {
  const result = { new: false };

  if (!incp.getNodes().has(body.id)) {
    yield tryCatch(incp.connectTo(body.host, body.port));
    result.new = true;
  }

  return result;
};
