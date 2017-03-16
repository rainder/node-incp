'use strict';

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

    server.on('listening', () => {
      this.incp.getConfiguration().setPort(server.address().port);
    });

    server.on('connection', (socket) => {
      socket.setKeepAlive(true);
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
    return new Promise((resolve, reject) => {
      this[$SERVER].getConnections((err, result) => {
        err ? reject(err) : resolve(result);
      });
    });
  }

  /**
   *
   * @returns {Promise}
   */
  start() {
    return new Promise((resolve, reject) => {
      this[$SERVER].listen({
        host: this.incp.getConfiguration().getHost(),
        port: this.incp.getConfiguration().getPort(),
      }, (err) => {
        if (err) {
          return reject(err);
        }

        const address = this[$SERVER].address();

        this.incp.getConfiguration().setHost(address.address);
        this.incp.getConfiguration().setPort(address.port);

        resolve(address);
      });
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
  shutdown() {
    return new Promise((resolve) => {
      this[$SERVER].close();

      for (const socket of this[$SOCKETS].values()) {
        socket.end();
      }

      resolve();
    });
  }
}

module.exports = Server;
