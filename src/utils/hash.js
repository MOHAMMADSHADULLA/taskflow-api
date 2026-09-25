const crypto = require('crypto');

/**
 * Refresh tokens are stored hashed, never in plaintext - the same principle
 * as password storage. A leaked database then doesn't hand out valid
 * refresh tokens.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { hashToken };
