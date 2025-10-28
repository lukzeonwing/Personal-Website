const path = require('path');

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

const PORT = process.env.PORT || 4000;
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const META_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_WEB_ROOT = '/uploads';
const WORKSHOP_GALLERY_DIR = path.join(UPLOADS_DIR, 'workshop');
const WORKSHOP_GALLERY_WEB_PATH = `${UPLOADS_WEB_ROOT}/workshop`;
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-strong-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Jarvis-Admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || '250mb';

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  PORT,
  PROJECTS_FILE,
  STORIES_FILE,
  META_FILE,
  UPLOADS_DIR,
  UPLOADS_WEB_ROOT,
  WORKSHOP_GALLERY_DIR,
  WORKSHOP_GALLERY_WEB_PATH,
  JWT_SECRET,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  BODY_SIZE_LIMIT,
};
