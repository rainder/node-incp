'use strict';

module.exports = function ({ data, incp }) {
  return incp.onPush(data);
};
