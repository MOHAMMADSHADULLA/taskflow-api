const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs after an array of express-validator checks on a route. Collects
 * every failing field into one 422 response instead of failing on the
 * first error, so the client can fix everything in one round trip.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  const error = new AppError('Validation failed', 422);
  error.details = details;
  return next(error);
}

module.exports = validate;
