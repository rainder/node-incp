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

    //utils.pipeEvent('message', this, manager);

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
      console.error('SAME');
      return;
    }

    if (this[SERVER_SOCKET$]) {
      //socket.destroy();
      //return;
      console.error('OVERWRITING SERVER SOCKET');
      //return;
      this[SERVER_SOCKET$].destroy();
    }

    //socket.removeAllListeners('data');

    this[SERVER_SOCKET$] = socket;

    const send = dataHandler.outcoming(socket);

    //console.log(new Error().stack.split('\n').slice(0, 3), this.cfg);

    //todo WHY DAFUQ???
    socket.removeAllListeners('data');

    socket.on('data', dataHandler.incoming((message) => {
      messageHandler(this, message, socket, (err, data) => {
        const payload = dataHandler.make.res(message.id, !err, err || data);
        //console.log('GOT MESSAGE', message, 'RESPONDING WITH', payload);
        send(payload);
      });
    }));

    if (this[CLIENT$]) {
      this.duplexDFD.resolve();
    }
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
   * @param socket
   */
  setClient(client) {
    const socket = client.getSocket();

    if (this[CLIENT$] === client) {
      return;
    }

    if (this[CLIENT$]) {
      //socket.destroy();
      //return;
      this[CLIENT$].close();
      console.error('OVERWRITING CLIENT', client.connectionOptions, client.reconnect);
    }

    this[CLIENT$] = client;
    this._send = dataHandler.outcoming(socket);

    socket.removeAllListeners('data');
    socket.on('data', dataHandler.incoming((message) => {
      messageHandler(this, message, socket);
    }));
    socket.on('connect', () => {
      const req = dataHandler.make.req('handshake', this.cfg);

      this._send(req.message);

      req.callback.then((response) => {
        this._processHandshakeResponse(response);
      });
    });
  }

  /**
   *
   * @private
   */
  _send() {
    throw new Error('Missing client connection');
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

      if (this[SERVER_SOCKET$]) {
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
    this.emit('close');
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