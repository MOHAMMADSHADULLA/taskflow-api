const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');

const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const nestedTaskRoutes = require('./routes/task.routes');
const directTaskRoutes = require('./routes/task.direct.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(apiLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', nestedTaskRoutes);
app.use('/api/tasks', directTaskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
