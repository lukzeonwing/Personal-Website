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

// Security: Require critical environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Validate critical security settings
if (!JWT_SECRET || JWT_SECRET === 'replace-with-strong-secret') {
  console.error('FATAL: JWT_SECRET environment variable must be set to a strong secret');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

if (JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

if (!ADMIN_USERNAME || ADMIN_USERNAME.length < 3) {
  console.error('FATAL: ADMIN_USERNAME environment variable must be set (minimum 3 characters)');
  process.exit(1);
}

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error('FATAL: ADMIN_PASSWORD environment variable must be set (minimum 8 characters)');
  process.exit(1);
}

const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || '50mb'; // Reduced from 250mb

// Build allowed origins from base list + domain if provided
const baseOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4000';
const DOMAIN = process.env.DOMAIN;
let ALLOWED_ORIGINS = baseOrigins;

// If DOMAIN is set, add it to allowed origins with common ports
if (DOMAIN) {
  const domainOrigins = [
    `http://${DOMAIN}`,
    `https://${DOMAIN}`,
    `http://${DOMAIN}:3000`,
    `http://${DOMAIN}:4000`,
    `http://${DOMAIN}:5173`,
  ].join(',');
  ALLOWED_ORIGINS = `${baseOrigins},${domainOrigins}`;
}

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
  ALLOWED_ORIGINS,
};
