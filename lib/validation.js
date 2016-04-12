'use strict';

const _ = require('lodash');
const V = require('skerla-json-schema');
const ICError = require('./ic-error');

/**
 *
 * @param constructor
 * @returns {module.exports|exports}
 */
module.exports = function (constructor) {
  return new V(constructor);
};

/**
 *
 * @param schema
 * @returns {Function}
 * @constructor
 */
module.exports.Schema = function validation(schema) {
  const validation = new V.Schema(schema);

  /**
   *
   */
  return function (data) {
    const result = validation.validate(data);

    if (!result.isValid()) {
      throw new ICError.VALIDATION_FAILURE(result.getErrors());
    }

    return result;
  };
};