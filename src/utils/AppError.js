/**
 * An "operational" error: something the client did wrong (bad input,
 * missing resource, expired token) as opposed to a bug. The error handler
 * middleware uses `isOperational` to decide whether it's safe to send
 * `message` straight to the client, or whether to hide the details behind
 * a generic 500.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
