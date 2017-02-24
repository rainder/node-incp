'use strict';

const co = require('co');
const Node = require('./node');
const events = require('events');
const Loopback = require('./loopback');
const Client = require('./client');
const Server = require('./server');
const INCPError = require('./incp-error');
const Configuration = require('./configuration');
const debug = require('debug');
const os = require('os');

const d = {
  i_am: debug('incp:i-am'),
  node_add: debug('incp:node:add'),
  node_remove: debug('incp:node:remove'),
  introducing: debug('incp:introducing'),
};

const $NODES = Symbol();
const $SERVER = Symbol();
const $LOOPBACK = Symbol();
const $CONFIGURATION = Symbol();

class INCP extends events.EventEmitter {
  /**
   *
   * @param configuration
   */
  constructor(configuration = {}) {
    super();

    configuration.os = {
      hostname: os.hostname(),
    };

    this[$CONFIGURATION] = new Configuration(configuration);
    this[$SERVER] = new Server(this);
    this[$LOOPBACK] = new Loopback(this);
    this[$NODES] = new Map();
    this.shutting_down = false;
    this.blacklist = new Set();

    this[$CONFIGURATION].on('change', (property) => this._change(property));

    d.i_am(this[$CONFIGURATION].getId(), `${this[$CONFIGURATION].getHost()}:${this[$CONFIGURATION].getPort()}`);
  }

  /**
   *
   * @param node {Node}
   * @private
   */
  _addNode(node) {
    const configuration = node.getConfiguration();
    const nodeId = configuration.getId();

    node.getConfiguration().setHost(node.getSocket().remoteAddress);

    this[$NODES].set(nodeId, node);
    this.emit('add', node);
    // d.node_add(`${configuration.getId()}:${configuration.getPort()} ${node.is_client}`)
    d.node_add(node);

    // node.getSocket().on('error', (err) => {
    //   this.emit('error', err);
    // });

    node.getSocket().on('close', () => {
      node.getSocket().removeAllListeners();
      this[$NODES].delete(nodeId);
      this.emit('remove', node);
      d.node_remove(`${configuration.getId()}:${configuration.getPort()} ${node.is_client}`);

      this.connectTo(node.getConfiguration().getPort(), node.getConfiguration().getHost())
        .catch(() => null);
    });

    this._introduce(node);
  }

  /**
   *
   * @param newNode {Node}
   * @private
   */
  _introduce(newNode) {
    for (const oldNode of this[$NODES].values()) {
      if (oldNode.getConfiguration().getId() === newNode.getConfiguration().getId()) {
        continue;
      }

      d.introducing(`${newNode.getConfiguration().getId()} <-> ${oldNode.getConfiguration().getId()}`);
      oldNode.getSocket().dataHandler.push({
        method: 'introduce',
        data: { configuration: newNode.getConfiguration() },
      }).catch(() => null);

      newNode.getSocket().dataHandler.push({
        method: 'introduce',
        data: { configuration: oldNode.getConfiguration() },
      }).catch(() => null);
    }
  }

  /**
   *
   * @private
   */
  _change(property) {
    const configuration = this.getConfiguration();

    for (const node of this[$NODES].values()) {
      node.getSocket().dataHandler.push({
        method: 'change',
        data: {
          property,
          configuration,
        },
      }).catch(() => null);
    }
  }

  /**
   *
   * @param port {Number}
   * @param host {String}
   * @private
   */
  _checkBlacklist(port, host) {
    if (this.blacklist.has(`${host}:${port}`)) {
      throw new INCPError.HOST_BLACLISTED(`${host}:${port}`);
    }
  }

  /**
   *
   * @param port
   * @param host
   * @param options
   * @returns {*}
   */
  connectTo(port, host = '127.0.0.1', options = {}) {
    return co(function *() {
      if (this.shutting_down) {
        throw new INCPError.LOCAL_SHUTTING_DOWN();
      }

      this._checkBlacklist(port, host);

      for (const node of this.getNodes().values()) {
        if (node.getConfiguration().getHost() === host && node.getConfiguration().getPort() === port) {
          return Promise.resolve(node);
        }
      }

      const client = new Client(this, {
        max_retries_count: options.max_retries_count,
      });

      client.on('error', () => null);

      yield client.connect(port, host);

      const response = yield client.getSocket().dataHandler.request({
        method: 'handshake',
        data: {
          configuration: this.getConfiguration(),
        },
      }, { timeout: 30000 }).catch((e) => {
        if (e.type === 'INCPError') {
          const errorCodes = [
            INCPError.LOOPBACK_CONNECTION.errno(),
            INCPError.GROUP_MISMATCH.errno(),
            INCPError.INVALID_PROTO.errno(),
          ];

          if (errorCodes.includes(e.errno)) {
            this.blacklist.add(`${host}:${port}`);
          }
        }

        client.close();

        throw e;
      });

      const remoteConfiguration = new Configuration(response.configuration);

      if (this[$NODES].has(remoteConfiguration.getId())) {
        client.close();
        throw new INCPError.ALREADY_CONNECTED();
      }

      const node = new Node(remoteConfiguration, client.getSocket(), true);

      // console.log(`add node 1`);
      this._addNode(node);

      return node;
    }.call(this));
  }

  /**
   *
   * @returns {Configuration}
   */
  getConfiguration() {
    return this[$CONFIGURATION];
  }

  /**
   *
   * @returns {*}
   */
  getServer() {
    return this[$SERVER];
  }

  /**
   *
   * @returns {*}
   */
  getNodes() {
    return this[$NODES];
  }

  /**
   *
   * @returns {*}
   */
  getLoopback() {
    return this[$LOOPBACK];
  }

  /**
   *
   * @returns {*}
   */
  startServer() {
    return co(this[$SERVER].start());
  }

  /**
   *
   */
  shutdown() {
    this.shutting_down = true;

    return co(function *() {
      yield this[$SERVER].shutdown();

      for (const node of this.getNodes().values()) {
        yield node.close();
      }
    }.call(this));
  }

  /**
   *
   */
  /*override*/
  onRequest() {
    throw new Error('not implemented');
  }

  /**
   *
   */
  /*override*/
  onPush() {
    throw new Error('not implemented');
  }
};

INCP.Error = INCPError;

module.exports = INCP;
