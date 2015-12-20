'use strict';

module.exports = class GroupedCollection {
  /**
   *
   */
  constructor() {
    this.map = new Map();
  }

  /**
   *
   * @param group
   * @param item
   */
  add(group, item) {
    let collection = this.map.get(group);
    if (!collection) {
      collection = [];
      this.map.set(group, collection);
    }

    collection.push(item);
  }

  /**
   *
   * @param group
   * @returns {*}
   */
  get(group) {
    return this.map.get(group);
  }

  /**
   *
   * @param group
   * @param node
   * @returns {boolean}
   */
  delete(group, node) {
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
  }
};