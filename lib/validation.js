'use strict';

const _ = require('lodash');
const jsonSchemaValidationPipeline = require('json-schema-validation-pipeline');
const ICError = require('./ic-error');

const V = jsonSchemaValidationPipeline.V;

/**
 *
 * @param pipeline
 * @returns {Function}
 */
module.exports = function validation(pipeline) {
  if (_.isPlainObject(pipeline)) {
    pipeline = [{ $schema: pipeline }]
  }

  const validate = jsonSchemaValidationPipeline(pipeline);

  /**
   *
   */
  return function (data) {
    const result = validate(data);

    if (!result.isValid) {
      throw new ICError.VALIDATION_FAILURE(result.errors);
    }

    return data;
  };
}

module.exports.V = jsonSchemaValidationPipeline.V;