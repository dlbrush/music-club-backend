const jsonschema = require('jsonschema');
const BadRequestError = require('./errors');

/**
 * Generic function for validating a request object (body or query) against a json schema
 * @param {Object} object 
 * @param {JSON} schema 
 */
function validateRequest(object, schema) {
  const validator = jsonschema.validate(object, schema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }
}

module.exports = {
  validateRequest
}