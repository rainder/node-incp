'use strict';

module.exports = function *(body, incp, connection) {
  return yield incp.onRequest(body);
};
