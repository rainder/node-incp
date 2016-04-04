'use strict';

const _ = require('lodash');
const callbacks = require('skerla-callbacks').init('ic-request');
const validation = require('./../validation');
const TYPE = 'response';

const V = validation.V;
const validate = validation([{
  $schema: {
    id: V(String).required(),
    type: V(String).oneOf([
      TYPE
    ]).required(),
    //data: V(Object)
  }
}]);

/**
 *
 * @type {ICResponse}
 */
class ICResponse {
  /**
   *
   */
  constructor(object) {
    this.id = undefined;
    this.success = undefined;
    this.data = undefined;

    if (object) {
      this.id = object.id;
      this.success = object.success;
      this.data = object.data;
    }
  }

  /**
   *
   * @param object
   * @returns {ICResponse}
   */
  static create(object) {
    return new ICResponse(object);
  }

  /**
   *
   * @param payload
   * @returns {ICResponse}
   */
  static createFromIncoming(payload) {
    validate(payload)
    return new ICResponse(payload);
  }

  /**
   *
   * @param id
   * @returns {ICResponse}
   */
  setId(id) {
    this.id = id;
    return this;
  }

  /**
   *
   * @param err
   * @returns {ICResponse}
   */
  setError(err) {
    this.success = false;

    if (err instanceof Error) {
      console.error(err.stack);
    //} else {
      //console.error(err);
    }

    //console.error(err);

    this.data = {
      errno: err.errno || 0,
      message: err.message,
      info: err.info
    };
    return this;
  }

  /**
   *
   * @param data
   * @returns {ICResponse}
   */
  setData(data) {
    this.success = true;
    this.data = data;
    return this;
  }

  /**
   *
   * @param socket
   * @returns {boolean}
   */
  send(socket) {
    try {
      socket.write(JSON.stringify({
        id: this.id,
        type: TYPE,
        success: this.success,
        data: this.data
      }) + '\n');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   *
   * @returns {*|boolean}
   */
  deliver() {
    if (this.success) {
      return callbacks.success(this.id, this.data);
    } else {
      return callbacks.fail(this.id, this.data);
    }
  }
};

module.exports = _.extend(ICResponse, {
  TYPE
});