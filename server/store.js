const fs = require('fs/promises');
const path = require('path');
const defaultData = require('./defaultData');
const {
  PROJECTS_FILE,
  STORIES_FILE,
  META_FILE,
  UPLOADS_DIR,
  WORKSHOP_GALLERY_DIR,
  ADMIN_PASSWORD,
} = require('./config');
const { clone } = require('./lib/utils');
const { normalizeProjectMedia } = require('./lib/projects');
const { hashPassword } = require('./lib/auth');
const logger = require('./lib/logger');

const defaultMeta = {
  categories: defaultData.categories,
  messages: defaultData.messages,
  bannedIps: defaultData.bannedIps,
  about: defaultData.about,
  contact: defaultData.contact,
  adminPasswordHash: null,
};

let data = {
  projects: clone(defaultData.projects),
  stories: clone(defaultData.stories),
  categories: clone(defaultData.categories),
  messages: clone(defaultData.messages),
  bannedIps: clone(defaultData.bannedIps),
  about: clone(defaultData.about),
  contact: clone(defaultData.contact),
  adminPasswordHash: null,
};

async function ensureJsonFile(filePath, defaultContent) {
  try {
    await fs.access(filePath);
  } catch (error) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
}

async function ensureDataFiles() {
  await Promise.all([
    ensureJsonFile(PROJECTS_FILE, defaultData.projects),
    ensureJsonFile(STORIES_FILE, defaultData.stories),
    ensureJsonFile(META_FILE, defaultMeta),
    fs.mkdir(path.join(UPLOADS_DIR, 'projects'), { recursive: true }),
    fs.mkdir(path.join(UPLOADS_DIR, 'stories'), { recursive: true }),
    fs.mkdir(path.join(UPLOADS_DIR, 'site'), { recursive: true }),
    fs.mkdir(WORKSHOP_GALLERY_DIR, { recursive: true }),
  ]);
}

async function loadJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    logger.warn(`Failed to load ${path.basename(filePath)}, using defaults`, { error: error.message });
    return clone(fallback);
  }
}

async function saveData() {
  const meta = {
    categories: data.categories,
    messages: data.messages,
    bannedIps: data.bannedIps,
    about: data.about,
    contact: data.contact,
    adminPasswordHash: data.adminPasswordHash,
  };

  await Promise.all([
    fs.writeFile(PROJECTS_FILE, JSON.stringify(data.projects, null, 2), 'utf8'),
    fs.writeFile(STORIES_FILE, JSON.stringify(data.stories, null, 2), 'utf8'),
    fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), 'utf8'),
  ]);
}

async function loadData() {
  const [projectsRaw, storiesRaw, meta] = await Promise.all([
    loadJson(PROJECTS_FILE, defaultData.projects),
    loadJson(STORIES_FILE, defaultData.stories),
    loadJson(META_FILE, defaultMeta),
  ]);

  const normalizedProjectsResult = projectsRaw.map((project) => normalizeProjectMedia(project));
  const projects = normalizedProjectsResult.map(({ project }) => project);

  const stories = storiesRaw.map((story) => {
    if (!story || typeof story !== 'object') return story;
    const { featured, viewHistory, ...rest } = story;
    return {
      ...rest,
      viewHistory: Array.isArray(viewHistory) ? viewHistory : [],
    };
  });

  let needsMetaSave = false;
  let adminPasswordHash = meta.adminPasswordHash;

  if (!adminPasswordHash || typeof adminPasswordHash !== 'string' || adminPasswordHash.length === 0) {
    adminPasswordHash = hashPassword(ADMIN_PASSWORD);
    needsMetaSave = true;
  }

  data = {
    projects,
    stories,
    categories: meta.categories ?? [],
    messages: meta.messages ?? [],
    bannedIps: meta.bannedIps ?? [],
    about: meta.about ?? clone(defaultData.about),
    contact: meta.contact ?? clone(defaultData.contact),
    adminPasswordHash,
  };

  const projectsChanged = normalizedProjectsResult.some(({ changed }) => changed);

  if (needsMetaSave || projectsChanged) {
    await saveData();
  }

  return data;
}

function getData() {
  return data;
}

async function initializeStore() {
  await ensureDataFiles();
  await loadData();
}

module.exports = {
  defaultMeta,
  ensureDataFiles,
  loadData,
  saveData,
  getData,
  initializeStore,
};
