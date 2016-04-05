'use strict';

module.exports = class DoubleMap {
  constructor() {
    this.map = new Map();
  }

  /**
   *
   * @param scope
   * @param key
   * @param val
   */
  add(scope, key, val) {
    let map = this.map.get(scope);
    if (!map) {
      map = new Map();
      this.map.set(scope, map);
    }

    map.set(key, val);
  }

  /**
   *
   * @param scope
   * @returns {V}
   */
  getMap(scope) {
    let result = this.map.get(scope);
    if (!result) {
      result = new Map();
      this.map.set(scope, result);
    }

    return result;
  }
};