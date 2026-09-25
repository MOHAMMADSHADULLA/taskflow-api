const app = require('./app');
const { sequelize } = require('./models');
const env = require('./config/env');
const logger = require('./utils/logger');

async function start() {
  try {
    await sequelize.authenticate();
    // sync() auto-creates tables for this demo. In a real production
    // deployment, swap this for `sequelize-cli` migrations so schema
    // changes are versioned and reviewable instead of implicit.
    await sequelize.sync();
    logger.info('Database connected and synced');

    app.listen(env.port, () => {
      logger.info(`taskflow-api listening on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
