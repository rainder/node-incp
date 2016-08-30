'use strict';

module.exports = function *(body, incp, connection) {
  for (let key of Object.keys(body.metadata)) {
    const value = body.metadata[key];
    connection.NODE.metadata[key] = value;
  }
};
