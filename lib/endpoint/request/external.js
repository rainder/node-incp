'use strict';

const tryCatch = require('co-try-catch');

module.exports = function *(body, incp, connection) {
  return yield incp.onRequest(body);
};
