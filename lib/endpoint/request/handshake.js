'use strict';

const Configuration = require('./../../configuration');
const INCPError = require('./../../incp-error');
const Node = require('./../../node');
const debug = require('debug');

const d = {
  successful: debug('incp:handshake:successful'),
};

/**
 *
 * @param data
 * @param incp {INCP}
 * @param socket
 * @returns {number}
 */
module.exports = function *({ data, incp, socket }) {
  const localConfiguration = incp.getConfiguration();
  const remoteConfiguration = new Configuration(data.configuration);
  const node = new Node(remoteConfiguration, socket, false);

  remoteConfiguration.setHost(socket.remoteAddress);

  checkSelf(localConfiguration, remoteConfiguration);
  checkGroup(localConfiguration, remoteConfiguration);
  checkPriority(localConfiguration, remoteConfiguration, incp);
  checkIfExists(localConfiguration, remoteConfiguration, incp);

  d.successful(remoteConfiguration.getId());
  incp._addNode(node);

  return {
    configuration: incp.getConfiguration(),
  };
};

/**
 *
 * @param localConfiguration {Configuration}
 * @param remoteConfiguration {Configuration}
 */
function checkSelf(localConfiguration, remoteConfiguration) {
  if (localConfiguration.getId() === remoteConfiguration.getId()) {
    throw new INCPError.LOOPBACK_CONNECTION();
  }
}

/**
 *
 * @param localConfiguration {Configuration}
 * @param remoteConfiguration {Configuration}
 */
function checkGroup(localConfiguration, remoteConfiguration) {
  const expected = localConfiguration.getGroup();
  const actual = remoteConfiguration.getGroup();

  if (expected !== actual) {
    throw new INCPError.GROUP_MISMATCH(`expected ${expected}, got ${actual}`);
  }
}

/**
 *
 * @param localConfiguration {Configuration}
 * @param remoteConfiguration {Configuration}
 * @param incp {INCP}
 */
function checkPriority(localConfiguration, remoteConfiguration, incp) {
  if (localConfiguration.getId() > remoteConfiguration.getId()) {
    incp.connectTo(remoteConfiguration.getPort(), remoteConfiguration.getHost())
      .catch(() => null);

    throw new INCPError.TAKING_CONNECTION_OWNERSHIP(localConfiguration);
  }
}

/**
 *
 * @param localConfiguration {Configuration}
 * @param remoteConfiguration {Configuration}
 * @param incp {INCP}
 */
function checkIfExists(localConfiguration, remoteConfiguration, incp) {
  if (incp.getNodes().has(remoteConfiguration.getId())) {
    throw new INCPError.ALREADY_CONNECTED(localConfiguration);
  }
}
