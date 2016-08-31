'use strict';

const net = require('net');

module.exports = class Server {

  /**
   *
   * @param config
   */
  constructor(config, dataHandler) {
    this.options = config.getOptions();

    this._server = net.createServer({
      allowHalfOpen: false
    });
    this._server.listen(config.getOptions());

    this._server.on('error', (err) => this._error(err));
    this._server.on('listening', () => this._listening());
    this._server.on('connection', (socket) => {
      socket.setNoDelay(true).setKeepAlive(true, 60000);

      socket.on('error', () => {
        socket.end();
      });

      dataHandler.init(socket);
    });
  }

  /**
   *
   * @param err
   * @private
   */
  _error(err) {
    console.error('INCP Server Error', err);
  }

  /**
   *
   * @private
   */
  _listening() {
    const address = this._server.address();
    this.options.host = address.address;
    this.options.port = address.port;
    this.onReady();
  }

  /**
   * 
   */
  close() {
    this._server.close();
  }

  /**
   * 
   */
  onReady() {
    throw new Error('not implemented');
  }
}
