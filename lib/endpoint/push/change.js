'use strict';

const _ = require('lodash');
const Configuration = require('./../../configuration');

/**
 *
 * @param data
 * @param incp
 */
module.exports = function *({ data, incp }) {
  const configuration = new Configuration(data.configuration);
  const node = incp.getNodes().get(configuration.getId());

  if (!node) {
    return;
  }

  _.set(node.getConfiguration(), data.property, _.get(configuration, data.property));

  incp.emit('change', node, data.property);
};
