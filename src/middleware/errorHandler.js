const logger = require('../utils/logger');

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) {
    logger.error({ err }, 'Unexpected error');
  }

  const body = { error: message };
  if (err.details) body.details = err.details;

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
