'use strict';

module.exports = function *(data) {
  return yield this.incp._onMessage(data);
};