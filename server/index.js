const express = require('express');
const cors = require('cors');
const { PORT, BODY_SIZE_LIMIT, UPLOADS_DIR } = require('./config');
const { initializeStore } = require('./store');

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

async function bootstrap() {
  await initializeStore();

  const app = express();

  app.use(cors());
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

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
