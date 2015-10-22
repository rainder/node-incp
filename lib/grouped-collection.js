'use strict';

module.exports = GroupedCollection;

function GroupedCollection() {
  this.map = new Map();
}

/**
 *
 * @param group
 * @param item
 */
GroupedCollection.prototype.add = function (group, item) {
  let collection = this.map.get(group);
  if (!collection) {
    collection = [];
    this.map.set(group, collection);
  }

  collection.push(item);
};

/**
 *
 * @param group
 * @returns {V}
 */
GroupedCollection.prototype.get = function (group) {
  return this.map.get(group);
};

/**
 *
 * @param group
 * @param node
 * @returns {boolean}
 */
GroupedCollection.prototype.delete = function (group, node) {
  let collection = this.map.get(group);
  if (!collection) {
    return false;
  }

  let index = collection.indexOf(node);
  if (!~index) {
    return false;
  }

  collection.splice(index, 1);

  if (!collection.length) {
    this.map.delete(group);
  }

  return true;
};