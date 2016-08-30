'use strict';

const net = require('net');

module.exports = class Server {

  /**
   *
   * @param config
   */
  constructor(config) {
    this.options = config.getOptions();

    this._server = net.createServer();
    this._server.listen(config.getOptions());

    this._server.on('error', (err) => this._error(err));
    this._server.on('listening', () => this._listening());
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
  onReady() {
    throw new Error('not implemented');
  }
}
