'use strict';

const net = require('net');
const co = require('co');
const debug = require('debug');

const dataHandler = require('./data-handler');
const ICRequest = require('./message/ic-request');
const ICResponse = require('./message/ic-response');

const SOCKET$ = Symbol();
const d = debug('incp:node');

module.exports = class Node {
  constructor(options) {
    this.options = options;
    this.reconnect = true;
    this.handshake;

    this[SOCKET$] = net.Socket();

    this[SOCKET$].on('error', (err) => this._onError(err));
    this[SOCKET$].on('connect', () => this._onConnect());
    this[SOCKET$].on('data', dataHandler.handle((message) => {
      ICResponse.createFromIncoming(message).deliver();
    }));

    this[SOCKET$].setEncoding('utf-8')
      .setKeepAlive(true, 30000)
      .setNoDelay(true);
  }

  /**
   *
   * @param err
   * @private
   */
  _onError(err) {
    console.error('Node Error:', err.message);
  }

  /**
   *
   * @private
   */
  _onConnect() {
    d(`node connection established ${this.options.remote.host}:${this.options.remote.port}`);
  }

  /**
   *
   * @returns {*}
   */
  *init() {
    yield cb => {
      const done = (err) => {
        if (err) {
          this[SOCKET$].removeListener('connect', done);
        } else {
          this[SOCKET$].removeListener('error', done);
        }

        cb(err);
      };

      this[SOCKET$].once('connect', done);
      this[SOCKET$].once('error', done);
      this[SOCKET$].connect({
        host: this.options.remote.host,
        port: this.options.remote.port
      });
    };

    const response = yield ICRequest.create('handshake', {
      id: this.options.local.id,
      port: this.options.local.port
    }).send(this[SOCKET$]);

    this.handshake = response;

    return response;
  }

  /**
   *
   * @param id
   * @param port
   */
  *introduce(id, port) {
    yield ICRequest.create('introduce', {
      id,
      port
    }).send(this[SOCKET$]);
  }

  /**
   *
   * @param id
   * @param nodes
   */
  *suggest(id, nodes) {
    const servers = [];
    for (let [id, node] of nodes.entries()) {
      servers.push({
        id,
        host: node.options.remote.host,
        port: node.options.remote.port
      });
    }

    for (let node of nodes.values()) {
      yield ICRequest.create('suggest', {
        servers
      }).send(node.getSocket());
    }
  }

  /**
   *
   * @param id
   */
  *shutdown(id) {
    yield ICRequest.create('shutdown', {
      id
    }).send(this[SOCKET$]);

    this.close();
  }

  /**
   *
   * @returns {*}
   */
  getSocket() {
    return this[SOCKET$];
  }

  /**
   *
   */
  close() {
    this.reconnect = false;
    this[SOCKET$].end();
  }

  /**
   * 
   * @param data
   * @returns {*}
   */
  send(data) {
    return ICRequest.create('external', data).send(this[SOCKET$]);
  }
}