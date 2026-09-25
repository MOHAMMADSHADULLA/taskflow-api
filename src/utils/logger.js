const pino = require('pino');
const env = require('../config/env');

// Plain JSON logs by default: that's what you want in production anyway,
// since CloudWatch (and most log aggregators) parse JSON lines natively.
const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : 'info',
});

module.exports = logger;
