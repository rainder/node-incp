'use strict';

const SOCKET$ = Symbol();
const DATA_HANDLER$ = Symbol();
const CONFIG$ = Symbol();

module.exports = class Node {
  constructor(dataHandler, config, socket, isClient) {
    this.id = null;
    this.isClient = isClient;
    this.metadata = {};
    this[CONFIG$] = config;
    this[SOCKET$] = socket;
    this[DATA_HANDLER$] = dataHandler;
  }

  *_handshake() {
    const response = yield this._request('handshake', {
      id: this[CONFIG$].getId(),
      group: this[CONFIG$].getOptions().group,
      port: this[CONFIG$].getOptions().port
    });

    this.id = response.id;
    this.host = this[SOCKET$].remoteAddress;
    this.port = response.port;

    return response;
  }

  _introduce(node) {
    return this._request('introduce', {
      id: node.getId(),
      host: node.host,
      port: node.port,
    });
  }

  _request(endpoint, data, timeout = 30000) {
    const payload = { endpoint, data };
    const options = { timeout };
    return this[DATA_HANDLER$].request(payload, options, this[SOCKET$]);
  }
  
  _push(endpoint, data) {
    const payload = { endpoint, data };
    const options = { };
    return this[DATA_HANDLER$].push(payload, options, this[SOCKET$]);
  }

  request(data, timeout = 30000) {
    return this._request('external', data, timeout);
  }

  push(data) {
    return this._push('external', data);
  }

  getSocket() {
    return this[SOCKET$];
  }

  getId() {
    return this.id;
  }
}
