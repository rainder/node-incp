'use strict';

const co = require('co');
const _ = require('lodash');
const objectId = require('objectid');
const callbacks = require('skerla-callbacks').init('ic-request');
const validation = require('./../validation');
const utils = require('./../utils');

const TYPE = 'request';

const V = validation.V;
const validate = validation([{
  $schema: {
    id: V(String).required(),
    method: V(String).required(),
    type: V(String).oneOf([
      TYPE
    ]).required(),
    data: V(Object)
  }
}]);

class ICRequest {
  constructor(payload) {
    this.type = TYPE;
    _.extend(this, payload);
  }

  /**
   *
   * @param method
   * @param data
   * @returns {ICRequest}
   */
  static create(method, data) {
    const id = objectId().toString();
    //const promise = callbacks.create({ id });
    return new ICRequest({ id, method, data })
  }

  /**
   *
   * @param payload
   * @returns {ICRequest}
   */
  static createFromIncoming(payload) {
    validate(payload);
    return new ICRequest(payload);
  }

  /**
   *
   * @returns {string|*}
   */
  getMethod() {
    return this.method;
  }

  /**
   *
   * @returns {payload.data|{command, data}|*}
   */
  getData() {
    return this.data;
  }

  /**
   *
   * @returns {*}
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @param socket
   */
  send(socket) {
    return co(function *() {
      const callback = callbacks.create({
        id: this.id
      });

      const payload = {
        id: this.id,
        type: TYPE,
        method: this.method,
        data: this.data
      };

      yield cb => socket.write(JSON.stringify(payload) + '\n', cb);

      const response = yield callback;

      //console.log(response);

      return response;
    }.call(this));
  }
}

module.exports = _.extend(ICRequest, {
  TYPE
});