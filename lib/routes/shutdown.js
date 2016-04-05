'use strict';

module.exports = function *(data) {
  const node = this.ic.nodeById.get(data.id);

  if (!node) {
    return;
  }

  node.close();
  this.ic.nodeById.delete(node.getId());
  this.ic.nodesByType.getMap(node.getType()).delete(node.getId());
  this.ic.nodes.delete(node.getId());
};