'use strict';

const q = require('q');
const co = require('co');
const _ = require('lodash');

const dataHandler = require('./data-handler');
const messageHandler = require('./message-handler');
const events = require('events');
const utils = require('./utils');
const callbacks = require('./callbacks');

const SERVER_SOCKET$ = Symbol();
const CLIENT$ = Symbol();

module.exports = class Node extends events.EventEmitter {
  constructor(cfg, manager) {
    super();
    this.cfg = cfg;
    this.serverCfg = null;
    this.clientCfg = null;
    this.manager = manager;
    this.duplexDFD = q.defer();
  }

  getServerSocket() {
    return this[SERVER_SOCKET$];
  }

  getClientSocket() {
    return this[CLIENT$].getSocket();
  }

  /**
   *
   * @param socket
   */
  setServerSocket(socket) {
    if (this[SERVER_SOCKET$] === socket) {
      //console.error('SAME'.red);
      return;
    }

    if (this[SERVER_SOCKET$]) {
      //console.error('OVERWRITING SERVER SOCKET');
      this[SERVER_SOCKET$].destroy();
    }

    this[SERVER_SOCKET$] = socket;

    //remove all listeners because of manager line 40 and 91
    socket.removeAllListeners('data');
    socket.on('data', dataHandler.incoming((message) => {
      messageHandler(this, message, socket, (err, data) => {
        dataHandler.res(socket, message.id, !err, err || data);
      });
    }));

    if (this[CLIENT$]) {
      this.duplexDFD.resolve();
    }
  }

  /**
   *
   * @param socket
   */
  setClient(client) {
    const socket = client.getSocket();

    if (this[CLIENT$] === client) {
      return;
    }

    if (this[CLIENT$]) {
      //console.error('OVERWRITING CLIENT', client.connectionOptions, client.reconnect);
      this[CLIENT$].close();
    }

    this[CLIENT$] = client;

    socket.on('data', dataHandler.incoming((message) => {
      messageHandler(this, message, socket);
    }));
    socket.on('connect', () => {
      dataHandler.req(socket, 'handshake', this.cfg).then((response) => {
        this._processHandshakeResponse(response);
      });
    });
  }

  /**
   *
   * @returns {*}
   */
  isClientSocketAlive() {
    if (!this[CLIENT$]) {
      return false;
    }

    return this[CLIENT$].getSocket().writable;
  }

  /**
   *
   * @param data {{cfg, suggestion}}
   * @private
   */
  _processHandshakeResponse(data) {
    return co(function *() {
      this.clientCfg = data.cfg;
      this.manager.mapByType.add(this.clientCfg.type, this);

      yield this.manager.processSuggestion(data.suggestion);

      if (this[SERVER_SOCKET$] && this[SERVER_SOCKET$].writable) {
        this.duplexDFD.resolve();
      }
    }.call(this));
  }

  /**
   *
   * @param data
   * @returns {*|promise}
   */
  sendRequest(data) {
    return dataHandler.req(this[CLIENT$].getSocket(), 'external', data);
  };

  /**
   *
   * @param data
   * @returns {*|promise}
   */
  sendPush(data) {
    return dataHandler.push(this[CLIENT$].getSocket(), 'external', data);
  };

  /**
   *
   * @returns {Function}
   */
  waitForEstablishedConnection() {
    return this.duplexDFD.promise;
  }

  /**
   *
   */
  close() {
    this[CLIENT$].close();
  }

  *shutdown() {
    const socket = this[CLIENT$].getSocket();
    if (!socket || !socket.writable) {
      return false;
    }

    return yield dataHandler.req(this[CLIENT$].getSocket(), 'shutdown', {});
  }

  /**
   *
   */
  getClientCfg() {
    return _.clone(this.clientCfg) || {};
  }

  getServerCfg() {
    return _.clone(this.serverCfg) || {};
  }
};