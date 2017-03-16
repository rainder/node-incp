'use strict';

/**
 *
 * @param data
 * @param incp
 * @returns {Promise.<*|Promise.<*>>}
 */
module.exports = async ({ data, incp }) => {
  return await incp.onRequest(data);
};
