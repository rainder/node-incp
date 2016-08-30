'use strict';

const SOCKET$ = Symbol();
const DATA_HANDLER$ = Symbol();
const CONFIG$ = Symbol();

module.exports = class Node {

  /**
   *
   * @param dataHandler
   * @param config
   * @param socket
   * @param isClient
   */
  constructor(dataHandler, config, socket, isClient) {
    this.id = null;
    this.metadata = null;
    this.isClient = isClient;
    this[CONFIG$] = config;
    this[SOCKET$] = socket;
    this[DATA_HANDLER$] = dataHandler;

    if (isClient) {
      this.host = socket.remoteAddress;
      this.port = socket.remotePort;
    } else {
      this.host = socket.localAddress;
      this.port = socket.localPort;
    }
    
    socket.NODE = this;
  }

  /**
   *
   * @returns {*}
   * @private
   */
  *_handshake() {
    const response = yield this._request('handshake', {
      id: this[CONFIG$].getId(),
      group: this[CONFIG$].getOptions().group,
      port: this[CONFIG$].getOptions().port,
      metadata: this[CONFIG$].getMetadata()
    });

    this.id = response.id;
    this.metadata = response.metadata;

    return response;
  }

  /**
   *
   * @param nodes
   * @returns {Promise}
   * @private
   */
  _introduce(nodes) {
    const data = { nodes: [] };

    for (let node of nodes) {
      if (node === this) {
        continue;
      }

      data.nodes.push({
        host: node.host,
        port: node.port
      });
    }

    return this._push('introduce', data)
  }

  /**
   *
   * @param endpoint
   * @param data
   * @param timeout
   * @returns {Promise}
   * @private
   */
  _request(endpoint, data, timeout = 30000) {
    const payload = { endpoint, data };
    const options = { timeout };
    return this[DATA_HANDLER$].request(payload, options, this[SOCKET$]);
  }

  /**
   *
   * @param endpoint
   * @param data
   * @returns {Promise}
   * @private
   */
  _push(endpoint, data) {
    const payload = { endpoint, data };
    const options = {};
    return this[DATA_HANDLER$].push(payload, options, this[SOCKET$]);
  }

  /**
   *
   * @param metadata
   * @returns {Promise}
   * @private
   */
  _metadata(metadata) {
    return this._push('metadata', { metadata });
  }

  /**
   *
   * @param data
   * @param timeout
   * @returns {*}
   */
  request(data, timeout = 30000) {
    return this._request('external', data, timeout);
  }

  /**
   *
   * @param data
   * @returns {*}
   */
  push(data) {
    return this._push('external', data);
  }

  /**
   *
   * @returns {Socket}
   */
  getSocket() {
    return this[SOCKET$];
  }

  /**
   *
   * @returns {String}
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @returns {*}
   */
  getMetadata() {
    return this.metadata;
  }
}
