'use strict';

module.exports = function *(data) {
  const node = this.incp.nodes.get(data.id);

  if (node) {
    node.options.remote.flags[data.key] = data.value;
    this.incp.emit('flag', data.key, data.value, node);
  }

  return {};
};