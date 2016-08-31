'use strict';

const SOCKET$ = Symbol();
const DATA_HANDLER$ = Symbol();

module.exports = class Node {

  /**
   *
   * @param dataHandler
   * @param socket
   * @param isClient
   */
  constructor(id, metadata, host, port, dataHandler, socket, isClient) {
    this.id = id;
    this.metadata = metadata;
    this.host = host;
    this.port = port;
    this.is_client = isClient;

    this[SOCKET$] = socket;
    this[DATA_HANDLER$] = dataHandler;
  }

  /**
   *
   * @param dataHandler {RequestResponseWrapper}
   * @param socket {Socket}
   * @param handshakeResponse {{id, metadata, port}}
   * @returns {Node}
   */
  static createFromClientSocket(dataHandler, socket, handshakeResponse) {
    return new Node(
      handshakeResponse.id,
      handshakeResponse.metadata,
      socket.remoteAddress,
      socket.remotePort,
      dataHandler,
      socket,
      true
    );
  }

  /**
   * @param dataHandler {RequestResponseWrapper}
   * @param socket {Socket}
   * @param handshakeResponse {{id, metadata, port}}
   * @returns {Node}
   */
  static createFromServerSocket(dataHandler, socket, handshakeResponse) {
    return new Node(
      handshakeResponse.id,
      handshakeResponse.metadata,
      socket.remoteAddress,
      handshakeResponse.port,
      dataHandler,
      socket,
      false
    );
  }

  /**
   *
   * @param dataHandler {RequestResponseWrapper}
   * @param socket {Socket}
   * @param config {Config}
   * @returns {Promise}
   * @private
   */
  static _handshake(dataHandler, socket, config) {
    return dataHandler.request({
      endpoint: 'handshake',
      data: {
        id: config.getId(),
        group: config.getOptions().group,
        port: config.getOptions().port,
        metadata: config.getMetadata()
      }
    }, { timeout: 5000 }, socket);
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

    if (data.nodes.length === 0) {
      return Promise.resolve();
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
