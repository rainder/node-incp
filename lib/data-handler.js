'use strict';

module.exports = {
  handle
};

/**
 *
 * @param socket
 * @param cb
 * @returns {Function}
 */
function handle(cb) {
  let fragment = '';

  return function (data) {
    let split = data.split('\n');

    if (split.length === 1) {
      fragment += split[0];
      return;
    }

    if (fragment.length) {
      split[0] = fragment + split[0];
      fragment = '';
    }

    for (let item of split) {
      if (!item.length) {
        continue;
      }

      try {
        cb(JSON.parse(item));
      } catch (e) {
        fragment = item;
      }
    }
  };
}