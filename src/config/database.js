const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

let sequelize;

if (env.nodeEnv === 'test') {
  // In-memory SQLite keeps the test suite fast and dependency-free — no
  // Postgres container needed in CI.
  sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
} else if (env.database.url) {
  sequelize = new Sequelize(env.database.url, {
    dialect: 'postgres',
    logging: false,
    dialectOptions:
      env.nodeEnv === 'production'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  });
} else {
  logger.warn(
    'DATABASE_URL not set — falling back to a local SQLite file (dev.sqlite). ' +
      'Set DATABASE_URL to a Postgres connection string for anything beyond local testing.'
  );
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './dev.sqlite',
    logging: false,
  });
}

module.exports = sequelize;
