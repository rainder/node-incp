'use strict';

const co = require('co');
const net = require('net');
const DataHandler = require('./data-handler');
// const dbg = require('./dbg');

const $SERVER = Symbol();
const $SOCKETS = Symbol();

class Server {

  /**
   *
   * @param incp {INCP}
   */
  constructor(incp) {
    this.incp = incp;
    this[$SERVER] = this._createServer(incp);
    this[$SOCKETS] = new Set();
  }

  /**
   *
   * @private
   */
  _createServer() {
    const server = net.createServer({
      allowHalfOpen: false,
    });

    server.on('connection', (socket) => {
      socket.dataHandler = new DataHandler(this.incp, socket);
      // dbg.inc('server.connection');

      this[$SOCKETS].add(socket);

      socket.on('error', (err) => {
        this.incp.emit('error', err);
      });

      socket.on('close', () => {
        // console.log('server close');
        // dbg.dec('server.connection');
        this[$SOCKETS].delete(socket);
      });
    });

    return server;
  }

  /**
   *
   * @returns {Promise}
   */
  getConnections() {
    const getter = (cb) => this[$SERVER].getConnections(cb);

    return co(function *() {
      return yield getter;
    });
  }

  /**
   *
   * @returns {*}
   */
  *start() {
    return yield (cb) => this[$SERVER].listen({
      host: this.incp.getConfiguration().getHost(),
      port: this.incp.getConfiguration().getPort(),
    }, (err) => {
      if (err) {
        return cb(err);
      }

      const address = this[$SERVER].address();

      this.incp.getConfiguration().setHost(address.address);
      this.incp.getConfiguration().setPort(address.port);

      cb(null, address);
    });
  }

  /**
   *
   * @returns {*}
   */
  getSockets() {
    return this[$SOCKETS];
  }

  /**
   *
   */
  *shutdown() {
    return yield (cb) => {
      this[$SERVER].close(cb);

      for (const socket of this[$SOCKETS].values()) {
        socket.end();
      }
    };
  }
}

module.exports = Server;
