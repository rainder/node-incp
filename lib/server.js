'use strict';

const net = require('net');

const CONFIG$ = Symbol();
const SERVER$ = Symbol();

module.exports = class Server {

  /**
   *
   * @param config
   */
  constructor(config, dataHandler) {
    const serverOptions = {
      allowHalfOpen: false,
    };

    this[CONFIG$] = config;

    this[SERVER$] = net.createServer(serverOptions);
    this[SERVER$].listen(config.getOptions());

    this[SERVER$].once('error', (err) => console.error('INCP Server Error', err));
    this[SERVER$].once('listening', () => {
      const options = this[CONFIG$].getOptions();
      const address = this[SERVER$].address();

      options.host = address.address;
      options.port = address.port;
    });
    this[SERVER$].on('connection', (socket) => {
      socket.setNoDelay(true).setKeepAlive(true, 60000);

      socket.on('error', () => {
        socket.end();
      });

      dataHandler.init(socket);
    });
  }

  /**
   *
   */
  close() {
    this[SERVER$].close();
  }

  /**
   *
   * @param cb
   * @returns {*}
   */
  getConnections(cb) {
    return this[SERVER$].getConnections(cb);
  }

  /**
   * 
   * @returns {*}
   */
  getServer() {
    return this[SERVER$];
  }
};
