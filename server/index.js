const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const { PORT, BODY_SIZE_LIMIT, UPLOADS_DIR } = require('./config');
const { initializeStore } = require('./store');
const { configureCors } = require('./middleware/cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers');
const logger = require('./lib/logger');

const createHealthRouter = require('./routes/health');
const createUploadsRouter = require('./routes/uploads');
const createWorkshopRouter = require('./routes/workshop');
const createAuthRouter = require('./routes/auth');
const createProjectsRouter = require('./routes/projects');
const createCategoriesRouter = require('./routes/categories');
const createContentRouter = require('./routes/content');
const createStoriesRouter = require('./routes/stories');
const createMessagesRouter = require('./routes/messages');
const createBannedIpsRouter = require('./routes/bannedIps');
const createMediaRouter = require('./routes/media');

async function bootstrap() {
  await initializeStore();

  const app = express();

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded cross-origin
    contentSecurityPolicy: false, // Disable CSP for now (configure based on your needs)
  }));

  // HTTP request logging
  app.use(morgan('combined', { stream: logger.stream }));

  // Middleware
  app.use(configureCors());
  app.use(express.json({ limit: BODY_SIZE_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.use('/api/health', createHealthRouter());
  app.use('/api/uploads', createUploadsRouter());
  app.use('/api/workshop', createWorkshopRouter());
  app.use('/api/auth', createAuthRouter());
  app.use('/api/projects', createProjectsRouter());
  app.use('/api/categories', createCategoriesRouter());
  app.use('/api/content', createContentRouter());
  app.use('/api/stories', createStoriesRouter());
  app.use('/api/messages', createMessagesRouter());
  app.use('/api/banned-ips', createBannedIpsRouter());
  app.use('/api/media', createMediaRouter());

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    logger.info(`API server listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', { error: error.message, stack: error.stack });
  process.exit(1);
});
