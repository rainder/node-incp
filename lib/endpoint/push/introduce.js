'use strict';

const Configuration = require('./../../configuration');
const debug = require('debug');

const d = {
  accepting: debug('incp:introduction:accepting'),
  unsuccessful: debug('incp:introduction:unsuccessful'),
  rejecting: debug('incp:introduction:rejecting'),
};

/**
 *
 * @param data
 * @param incp {INCP}
 */
module.exports = function *({ data, incp }) {
  const remoteConfiguration = new Configuration(data.configuration);
  const remoteId = remoteConfiguration.getId();

  if (incp.getNodes().has(remoteId)) {
    d.rejecting(`${remoteId}`);

    return;
  }

  if (remoteId === incp.getConfiguration().getId()) {
    d.rejecting(`${remoteId}`);

    return;
  }

  d.accepting(remoteId);
  incp.connectTo(remoteConfiguration.getPort(), remoteConfiguration.getHost())
    .catch(() => d.unsuccessful(`${remoteId}`));
};
