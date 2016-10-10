'use strict';

const co = require('co');
const INCPError = require('./incp-error');
const utils = require('./utils');
const defer = require('@rainder/defer');
const RequestResponseWrapper = require('@rainder/request-response-wrapper');

const endpoints = {
  request: {
    handshake: require('./endpoint/request/handshake'),
    external: require('./endpoint/request/external'),
    ping: require('./endpoint/request/ping'),
  },
  push: {
    metadata: require('./endpoint/push/metadata'),
    external: require('./endpoint/push/external'),
    introduce: require('./endpoint/push/introduce'),
  },
};

const PROTO = utils.proto(0x48, 0xfa, 0x55, 0x00);

module.exports = class DataHandler extends RequestResponseWrapper {

  /**
   *
   * @param incp
   */
  constructor(incp) {
    super();

    this.incp = incp;
  }

  /**
   *
   * @param socket
   */
  init(socket) {
    let stack = new Buffer(0);

    socket.on('data', (data) => {
      try {
        stack = Buffer.concat([stack, data]);

        while (stack.length) {
          if (Buffer.compare(stack.slice(0, 4), PROTO) !== 0) {
            socket.end();
            
            return console.error('invalid proto', data);
          }

          const length = stack.readInt32BE(4);

          if (stack.length < length + 8) {
            break;
          }

          const payload = stack.slice(8, length + 8);

          stack = stack.slice(length + 8);
          this.incomingMessage(payload, socket);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   *
   * @param data
   * @param socket
   * @returns {Promise}
   */
  send(data, socket) {
    const length = new Buffer(4);

    length.writeInt32BE(data.length, 0);

    const payload = Buffer.concat([
      PROTO,
      length,
      data,
    ]);
    
    return defer.callback((cb) => socket.write(payload, cb));
  }

  /**
   *
   * @param json
   * @param options
   * @param args
   * @returns {Promise.<TResult>}
   */
  request(json, options, ...args) {
    return super.request(new Buffer(JSON.stringify(json)), options, ...args)
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
   * @returns {Promise.<TResult>}
   */
  push(json, options, ...args) {
    return super.push(new Buffer(JSON.stringify(json)), options, ...args);
  }

  /**
   *
   * @param data
   * @param socket
   * @returns {Promise.<TResult>}
   */
  onRequest(data, socket) {
    const json = JSON.parse(data.toString());
    
    return co(go.call(this))
      .then((result) => new Buffer(JSON.stringify(result || null)))
      .catch((err) => {
        if (err instanceof Error) {
          err = { message: err.message, errno: err.errno };
        }

        return Promise.reject(new Buffer(JSON.stringify(err || null)));
      });

    /**
     *
     * @returns {*}
     */
    function *go() {
      if (!Object.prototype.hasOwnProperty.call(endpoints.request, json.endpoint)) {
        throw new INCPError.INVALID_ENDPOINT();
      }

      return yield endpoints.request[json.endpoint](json.data, this.incp, socket);
    }
  }

  onPush(data, socket) {
    const json = JSON.parse(data.toString());
    
    return co(go.call(this));

    /**
     *
     * @returns {*}
     */
    function *go() {
      if (!Object.prototype.hasOwnProperty.call(endpoints.push, json.endpoint)) {
        throw new INCPError.INVALID_ENDPOINT();
      }

      return yield endpoints.push[json.endpoint](json.data, this.incp, socket);
    }
  }
};

