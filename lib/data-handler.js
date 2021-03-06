'use strict';

const utils = require('./utils');
const defer = require('@rainder/defer');
const INCPError = require('./incp-error');
const messageHandler = require('./message-handler');
const RequestResponseWrapper = require('@rainder/request-response-wrapper');

const PROTO = utils.proto(0x48, 0xfa, 0x55, 0x01);

class DataHandler extends RequestResponseWrapper {
  /**
   *
   * @param incp
   * @param socket
   */
  constructor(incp, socket) {
    super();

    this.incp = incp;
    this.socket = this._bind(socket);
  }

  /**
   *
   * @param socket
   * @private
   */
  _bind(socket) {
    let stack = Buffer.alloc(0);

    socket.on('data', (data) => {
      stack = Buffer.concat([stack, data]);

      while (stack.length) {
        const proto = stack.slice(0, 4);

        if (Buffer.compare(proto, PROTO) !== 0) {
          socket.emit('error', new INCPError.INVALID_PROTO({ proto }));

          return socket.end();
        }

        const length = stack.readInt32BE(4);

        if (stack.length < length + 8) {
          break;
        }

        const payload = stack.slice(8, length + 8);

        stack = stack.slice(length + 8);

        try {
          this.receive(payload, socket);
        } catch (e) {
          socket.emit('error', e);
        }
      }
    });

    return socket;
  }

  /**
   *
   * @param data
   * @returns {*|Promise}
   */
  send(data) {
    const length = Buffer.alloc(4);

    length.writeInt32BE(data.length, 0);

    const payload = Buffer.concat([
      PROTO,
      length,
      data,
    ]);

    return defer.callback((cb) => this.socket.write(payload, cb));
  }

  /**
   *
   * @param json
   * @param options
   * @param args
   * @returns {Promise.<*>}
   */
  request(json, options, ...args) {
    return super.request(Buffer.from(JSON.stringify(json)), options, ...args)
      .then((result) => JSON.parse(result.toString()))
      .catch((err) => {
        try {
          err = JSON.parse(err);
        } catch (e) {
        }

        return Promise.reject(err);
      });
  }

  /**
   *
   * @param json
   * @param options
   * @param args
   * @returns {Promise.<*>}
   */
  push(json, options, ...args) {
    return super.push(Buffer.from(JSON.stringify(json)), options, ...args);
  }

  /**
   *
   * @param data
   * @param socket
   * @returns {Promise.<*>}
   */
  onRequest(data, socket) {
    const json = JSON.parse(data.toString());

    return messageHandler.request(this.incp, socket, json)
      .then((result) => Buffer.from(JSON.stringify(result || null)))
      .catch((err) => {
        if (err instanceof Error) {
          err = { message: err.message, errno: err.errno };
        }

        return Promise.reject(Buffer.from(JSON.stringify(err || null)));
      });
  }

  /**
   *
   * @param data
   * @param socket
   * @returns {Promise}
   */
  onPush(data, socket) {
    const json = JSON.parse(data.toString());

    return messageHandler.push(this.incp, socket, json);
  }
}

module.exports = DataHandler;
