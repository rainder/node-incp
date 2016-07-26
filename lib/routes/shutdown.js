'use strict';

const co = require('co');

module.exports = function *(data) {
  let closed = false;
  
  const node = this.incp.nodes.get(data.id);
  
  if (node) {
    node.close();
    this.incp.nodes.delete(data.id);
    closed = true;
  }

  return { closed };
};