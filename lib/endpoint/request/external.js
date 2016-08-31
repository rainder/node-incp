'use strict';

module.exports = function *(body, incp) {
  return yield incp.onRequest(body);
};
