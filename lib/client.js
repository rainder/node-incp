'use strict';

const _ = require('lodash');
const net = require('net');
const tls = require('tls');
const events = require('events');
const utils = require('./utils');
const DataHandler = require('./data-handler');
const debug = require('debug');

const $SOCKET = Symbol();

const d = {
  connecting: debug('incp:client:connecting'),
  retrying: debug('incp:client:retrying'),
  connected: debug('incp:client:connected'),
  giving_up: debug('incp:client:giving-up'),
};

class Client extends events.EventEmitter {

  /**
   *
   * @param incp {INCP}
   * @param options {{max_retries_count}}
   */
  constructor(incp, options = {}) {
    super();

    this.options = _.defaults(options, {
      max_retries_count: 50,
    });

    this.incp = incp;
    this.connecting = false;
    this[$SOCKET] = new net.Socket({
      allowHalfOpen: false,
    });

    this[$SOCKET]
      .setNoDelay(true)
      .setKeepAlive(true);

    if (incp.getConfiguration().getTLS()) {
      const tlsOptions = incp.getConfiguration().getTLS();

      this[$SOCKET] = new tls.TLSSocket(this[$SOCKET], {
        cert: tlsOptions.cert,
        key: tlsOptions.key,
        rejectUnauthorized: tlsOptions.rejectUnauthorized,
      });
    }

    this[$SOCKET].dataHandler = new DataHandler(incp, this[$SOCKET]);
  }

  /**
   *
   * @param port
   * @param host
   * @returns {Promise.<*>}
   */
  async connect(port, host = '127.0.0.1') {
    if (this.connecting) {
      return;
    }

    utils.pipeEvents('error', this[$SOCKET], this);
    utils.pipeEvents('close', this[$SOCKET], this);
    utils.pipeEvents('end', this[$SOCKET], this);

    d.connecting(`to ${host}:${port}`);

    let i = 0;

    while (true) {
      const timeout = i * 100;
      const error = await this._connect(port, host)
        .then(() => false, (err) => err);

      if (!error) {
        break;
      }

      await new Promise((cb) => setTimeout(cb, timeout));

      if (i === 0) {
        d.retrying(`${host}:${port}`);
      }

      if (++i >= this.options.max_retries_count) {
        this.connecting = false;
        d.giving_up(`on ${host}:${port}`);

        throw error;
      }
    }

    this.connecting = false;
    d.connected(`to ${host}:${port}`);
  }

  /**
   *
   * @param port
   * @param host
   * @returns {Promise}
   * @private
   */
  _connect(port, host) {
    this.connecting = true;

    (this[$SOCKET]._parent || this[$SOCKET]).connect(port, host);

    return new Promise((resolve, reject) => {
      /**
       *
       */
      const connect = () => {
        this[$SOCKET].removeListener('error', error);
        resolve();
      };

      /**
       *
       */
      const error = (err) => {
        this[$SOCKET].removeListener('connect', connect);
        reject(err);
      };

      this[$SOCKET].once('connect', connect);
      this[$SOCKET].once('error', error);
    });
  }

  /**
   *
   * @returns {*}
   */
  getSocket() {
    return this[$SOCKET];
  }

  /**
   *
   * @returns {Promise.<void>}
   */
  async close() {
    const socket = this.getSocket();

    socket.end();
  }
}

module.exports = Client;
