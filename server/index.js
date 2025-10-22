const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const defaultData = require('./defaultData');

const PORT = process.env.PORT || 4000;
const PROJECTS_FILE = path.join(__dirname, 'data', 'projects.json');
const STORIES_FILE = path.join(__dirname, 'data', 'stories.json');
const META_FILE = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const WORKSHOP_GALLERY_DIR = path.join(UPLOADS_DIR, 'workshop');
const WORKSHOP_GALLERY_WEB_PATH = '/uploads/workshop';
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-strong-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || '250mb';

const clone = (value) => JSON.parse(JSON.stringify(value));

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
    console.error(`Failed to load ${path.basename(filePath)}, using defaults:`, error.message);
    return clone(fallback);
  }
}

async function loadData() {
  const [projects, storiesRaw, meta] = await Promise.all([
    loadJson(PROJECTS_FILE, defaultData.projects),
    loadJson(STORIES_FILE, defaultData.stories),
    loadJson(META_FILE, defaultMeta),
  ]);

  const stories = storiesRaw.map((story) => {
    if (!story || typeof story !== 'object') return story;
    const { featured, viewHistory, ...rest } = story;
    return {
      ...rest,
      viewHistory: Array.isArray(viewHistory) ? viewHistory : []
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

  if (needsMetaSave) {
    await saveData();
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

function generateId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '0.0.0.0';
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function sanitizeProject(project) {
  const base = {
    ...project,
    viewHistory: project.viewHistory || []
  };
  return base;
}

function getExtensionFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'image/heic': 'heic',
  };
  if (map[mime]) {
    return map[mime];
  }
  const [, subtype] = mime.split('/');
  if (!subtype) return 'bin';
  return subtype.replace('+xml', '').replace('+', '.');
}

function sanitizeIdentifier(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateUploadFilename(extension, originalName) {
  const safeName = typeof originalName === 'string'
    ? originalName.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '')
    : '';
  const base = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = extension ? `.${extension.replace(/^\.+/, '')}` : '';

  if (safeName) {
    const withoutExt = safeName.replace(/\.[^.]+$/, '');
    return `${base}-${withoutExt}${ext}`;
  }

  return `${base}${ext}`;
}

const IMAGE_FILE_PATTERN = /\.(jpe?g|png|gif|webp|avif|heic)$/i;

function buildWorkshopGalleryFile(filename, req) {
  const encoded = encodeURIComponent(filename);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    filename,
    url: `${baseUrl}${WORKSHOP_GALLERY_WEB_PATH}/${encoded}`,
  };
}

function sanitizeString(value, fallback = '') {
  const str = typeof value === 'string' ? value.trim() : '';
  if (str.length === 0) {
    return fallback;
  }
  return str;
}

function sanitizeStringArray(values, fallback = []) {
  if (!Array.isArray(values)) {
    return fallback;
  }
  const cleaned = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);
  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeListGroups(groups, fallback = []) {
  if (!Array.isArray(groups)) {
    return fallback;
  }

  const cleaned = groups
    .map((group) => {
      if (!group || typeof group !== 'object') return null;
      const title = sanitizeString(group.title, '');
      const items = sanitizeStringArray(group.items, []);
      if (!title && items.length === 0) return null;
      return {
        title: title || 'Untitled',
        items,
      };
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeEducation(entries, fallback = []) {
  if (!Array.isArray(entries)) {
    return fallback;
  }

  const cleaned = entries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const title = sanitizeString(entry.title, '');
      const subtitle = sanitizeString(entry.subtitle, '');
      if (!title && !subtitle) return null;
      return {
        title: title || 'Untitled',
        subtitle,
      };
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeSocialLinks(links, fallback = []) {
  if (!Array.isArray(links)) {
    return fallback;
  }

  const cleaned = links
    .map((link) => {
      if (!link || typeof link !== 'object') return null;
      const type = sanitizeString(link.type, '');
      const label = sanitizeString(link.label, '');
      const url = sanitizeString(link.url, '');
      const description = sanitizeString(link.description, '');
      if (!type || !label || !url) return null;
      return {
        type,
        label,
        url,
        description,
      };
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeAboutContent(payload) {
  const fallback = defaultData.about;
  return {
    heroTitle: sanitizeString(payload.heroTitle, fallback.heroTitle),
    heroParagraphs: sanitizeStringArray(payload.heroParagraphs, fallback.heroParagraphs),
    heroImage: sanitizeString(payload.heroImage, fallback.heroImage),
    skills: sanitizeListGroups(payload.skills, fallback.skills),
    tools: sanitizeListGroups(payload.tools, fallback.tools),
    education: sanitizeEducation(payload.education, fallback.education),
  };
}

function sanitizeContactContent(payload) {
  const fallback = defaultData.contact;
  const email = payload.email && typeof payload.email === 'object' ? payload.email : {};
  const phone = payload.phone && typeof payload.phone === 'object' ? payload.phone : {};

  return {
    title: sanitizeString(payload.title, fallback.title),
    subtitle: sanitizeString(payload.subtitle, fallback.subtitle),
    connectHeading: sanitizeString(payload.connectHeading, fallback.connectHeading),
    connectDescription: sanitizeString(payload.connectDescription, fallback.connectDescription),
    email: {
      label: sanitizeString(email.label, fallback.email.label),
      address: sanitizeString(email.address, fallback.email.address),
    },
    phone: {
      label: sanitizeString(phone.label, fallback.phone.label),
      number: sanitizeString(phone.number, fallback.phone.number),
    },
    socials: sanitizeSocialLinks(payload.socials, fallback.socials),
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (!stored) {
    return false;
  }

  if (!stored.includes(':')) {
    return stored === password;
  }

  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derivedKey, 'hex'));
}

async function bootstrap() {
  await ensureDataFiles();
  await loadData();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: BODY_SIZE_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/uploads', requireAuth, async (req, res) => {
    const { data, filename, entityType, entityId } = req.body || {};

    if (typeof data !== 'string' || !data.startsWith('data:')) {
      return res.status(400).json({ message: 'Invalid image payload' });
    }

    const normalizedType = typeof entityType === 'string' ? entityType.toLowerCase() : '';
    const resolvedType =
      normalizedType === 'project' || normalizedType === 'projects'
        ? 'projects'
        : normalizedType === 'story' || normalizedType === 'stories'
          ? 'stories'
          : normalizedType === 'site' || normalizedType === 'content'
            ? 'site'
            : null;

    if (!resolvedType) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    const safeEntityId = sanitizeIdentifier(entityId);
    if (!safeEntityId) {
      return res.status(400).json({ message: 'Invalid entity identifier' });
    }

    const match = data.match(/^data:(image\/[a-zA-Z0-9+.\-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ message: 'Unsupported image format' });
    }

    const [, mimeType, base64String] = match;
    if (!base64String) {
      return res.status(400).json({ message: 'Invalid image data' });
    }

    const buffer = Buffer.from(base64String, 'base64');
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ message: 'Empty image data' });
    }

    const extension = getExtensionFromMime(mimeType);
    const fileName = generateUploadFilename(extension, filename);
    const entityDir = path.join(UPLOADS_DIR, resolvedType, safeEntityId);

    try {
      await fs.mkdir(entityDir, { recursive: true });
    } catch (error) {
      console.error('Failed to prepare upload directory:', error);
      return res.status(500).json({ message: 'Failed to prepare upload directory' });
    }

    const filePath = path.join(entityDir, fileName);

    try {
      await fs.writeFile(filePath, buffer);
    } catch (error) {
      console.error('Failed to save uploaded image:', error);
      return res.status(500).json({ message: 'Failed to store image' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${resolvedType}/${safeEntityId}/${fileName}`;

    return res.status(201).json({ url });
  });

  app.post('/api/workshop/gallery', requireAuth, async (req, res) => {
    const files = Array.isArray(req.body?.files) ? req.body.files : [];

    if (files.length === 0) {
      return res.status(400).json({ message: 'No images provided for upload' });
    }

    try {
      await fs.mkdir(WORKSHOP_GALLERY_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to prepare workshop gallery directory:', error);
      return res.status(500).json({ message: 'Failed to prepare gallery directory' });
    }

    const savedFiles = [];

    for (const file of files) {
      const { data, filename } = file || {};

      if (typeof data !== 'string' || !data.startsWith('data:')) {
        return res.status(400).json({ message: 'Invalid image payload in request' });
      }

      const match = data.match(/^data:(image\/[a-zA-Z0-9+\.\-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ message: 'Unsupported image format provided' });
      }

      const [, mimeType, base64String] = match;
      if (!mimeType?.startsWith('image/')) {
        return res.status(400).json({ message: 'Only image uploads are supported' });
      }

      if (!base64String) {
        return res.status(400).json({ message: 'Invalid image data provided' });
      }

      let buffer;
      try {
        buffer = Buffer.from(base64String, 'base64');
      } catch (error) {
        console.error('Failed to decode base64 image:', error);
        return res.status(400).json({ message: 'Failed to decode image data' });
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ message: 'Image data is empty' });
      }

      const extension = getExtensionFromMime(mimeType);
      const fileName = generateUploadFilename(extension, filename);
      const targetPath = path.join(WORKSHOP_GALLERY_DIR, fileName);

      try {
        await fs.writeFile(targetPath, buffer);
      } catch (error) {
        console.error('Failed to store workshop gallery image:', error);
        return res.status(500).json({ message: 'Failed to store one of the gallery images' });
      }

      savedFiles.push(buildWorkshopGalleryFile(fileName, req));
    }

    return res.status(201).json({ files: savedFiles });
  });

  app.get('/api/workshop/gallery', async (req, res) => {
    try {
      await fs.mkdir(WORKSHOP_GALLERY_DIR, { recursive: true });
      const entries = await fs.readdir(WORKSHOP_GALLERY_DIR);
      const files = entries
        .filter((filename) => IMAGE_FILE_PATTERN.test(filename))
        .sort((a, b) => a.localeCompare(b))
        .map((filename) => buildWorkshopGalleryFile(filename, req));

      return res.json({ files });
    } catch (error) {
      console.error('Failed to load workshop gallery images:', error);
      return res.status(500).json({ message: 'Failed to load workshop gallery images' });
    }
  });

  // Authentication
  app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    let isValid = verifyPassword(password, data.adminPasswordHash);

    if (!isValid && password === ADMIN_PASSWORD) {
      isValid = true;
      data.adminPasswordHash = hashPassword(ADMIN_PASSWORD);
      await saveData();
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  });

  app.get('/api/auth/me', requireAuth, (_req, res) => {
    return res.json({ role: 'admin' });
  });

  app.put('/api/auth/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const currentValid =
      verifyPassword(currentPassword, data.adminPasswordHash) || currentPassword === ADMIN_PASSWORD;

    if (!currentValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (verifyPassword(newPassword, data.adminPasswordHash)) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    data.adminPasswordHash = hashPassword(newPassword);
    await saveData();

    return res.json({ message: 'Password updated successfully' });
  });

  // Projects
  app.get('/api/projects', (_req, res) => {
    const projects = data.projects.map(sanitizeProject);
    res.json(projects);
  });

  app.get('/api/projects/:id', (req, res) => {
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.json(sanitizeProject(project));
  });

  app.post('/api/projects', requireAuth, async (req, res) => {
    const payload = req.body || {};
    if (!payload.title || !payload.description || !payload.category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const providedId = typeof payload.id === 'string' ? sanitizeIdentifier(payload.id) : '';
    const projectId = providedId || generateId('proj_');

    const newProject = {
      ...payload,
      id: projectId,
      views: payload.views ?? 0,
      viewHistory: [],
      featured: Boolean(payload.featured)
    };

    data.projects.push(newProject);
    await saveData();
    return res.status(201).json(sanitizeProject(newProject));
  });

  app.put('/api/projects/:id', requireAuth, async (req, res) => {
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existing = data.projects[index];
    const updates = req.body || {};

    const updatedProject = {
      ...existing,
      ...updates,
      id: existing.id,
      viewHistory: existing.viewHistory || []
    };

    data.projects[index] = updatedProject;
    await saveData();
    return res.json(sanitizeProject(updatedProject));
  });

  app.delete('/api/projects/:id', requireAuth, async (req, res) => {
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }

    data.projects.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  app.patch('/api/projects/:id/feature', requireAuth, async (req, res) => {
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.featured = !project.featured;
    await saveData();
    return res.json(sanitizeProject(project));
  });

  app.post('/api/projects/:id/view', async (req, res) => {
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const ip = getClientIp(req);
    if (data.bannedIps.some((entry) => entry.ip === ip)) {
      return res.status(403).json({ message: 'View blocked: IP address is banned' });
    }

    const viewRecord = {
      timestamp: Date.now(),
      ip,
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    project.views = (project.views || 0) + 1;
    project.viewHistory = [...(project.viewHistory || []), viewRecord];

    await saveData();
    return res.json({ views: project.views });
  });

  // Categories
  app.get('/api/categories', (_req, res) => {
    res.json(data.categories);
  });

  app.post('/api/categories', requireAuth, async (req, res) => {
    const { label } = req.body || {};
    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Category label is required' });
    }

    const id = label.toLowerCase().replace(/\s+/g, '-');

    if (data.categories.some((cat) => cat.id === id)) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const newCategory = { id, label: label.trim() };
    data.categories.push(newCategory);
    await saveData();
    return res.status(201).json(newCategory);
  });

  app.put('/api/categories/:id', requireAuth, async (req, res) => {
    const category = data.categories.find((cat) => cat.id === req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { label } = req.body || {};
    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Category label is required' });
    }

    category.label = label.trim();
    await saveData();
    return res.json(category);
  });

  app.delete('/api/categories/:id', requireAuth, async (req, res) => {
    if (data.categories.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last category' });
    }

    const index = data.categories.findIndex((cat) => cat.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const isInUse = data.projects.some((project) => project.category === req.params.id);
    if (isInUse) {
      return res.status(400).json({ message: 'Cannot delete category in use by projects' });
    }

    data.categories.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  // Site content
  app.get('/api/content/about', (_req, res) => {
    res.json(data.about);
  });

  app.put('/api/content/about', requireAuth, async (req, res) => {
    const payload = req.body || {};
    try {
      const sanitized = sanitizeAboutContent(payload);
      data.about = sanitized;
      await saveData();
      return res.json(data.about);
    } catch (error) {
      console.error('Failed to update about content:', error);
      return res.status(400).json({ message: 'Invalid about content payload' });
    }
  });

  app.get('/api/content/contact', (_req, res) => {
    res.json(data.contact);
  });

  app.put('/api/content/contact', requireAuth, async (req, res) => {
    const payload = req.body || {};
    try {
      const sanitized = sanitizeContactContent(payload);
      data.contact = sanitized;
      await saveData();
      return res.json(data.contact);
    } catch (error) {
      console.error('Failed to update contact content:', error);
      return res.status(400).json({ message: 'Invalid contact content payload' });
    }
  });

  // Stories
  app.get('/api/stories', (_req, res) => {
    res.json(data.stories);
  });

  app.get('/api/stories/:id', (req, res) => {
    const story = data.stories.find((s) => s.id === req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    return res.json(story);
  });

  app.post('/api/stories', requireAuth, async (req, res) => {
    const payload = req.body || {};
    if (!payload.title || !payload.description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const providedId = typeof payload.id === 'string' ? sanitizeIdentifier(payload.id) : '';
    const storyId = providedId || generateId('story_');

    const {
      contentBlocks = [],
      views = 0,
      featured: _deprecatedFeatured,
      viewHistory: _ignoredViewHistory,
      ...storyData
    } = payload;

    const newStory = {
      ...storyData,
      id: storyId,
      views,
      contentBlocks,
      viewHistory: []
    };

    data.stories.push(newStory);
    await saveData();
    return res.status(201).json(newStory);
  });

  app.put('/api/stories/:id', requireAuth, async (req, res) => {
    const index = data.stories.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const existing = data.stories[index];
    const updates = req.body || {};
    const {
      featured: _deprecatedFeatured,
      viewHistory: _ignoredViewHistory,
      ...updateData
    } = updates;

    const updatedStory = {
      ...existing,
      ...updateData,
      id: existing.id,
      viewHistory: existing.viewHistory || []
    };

    data.stories[index] = updatedStory;
    await saveData();
    return res.json(updatedStory);
  });

  app.delete('/api/stories/:id', requireAuth, async (req, res) => {
    const index = data.stories.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Story not found' });
    }

    data.stories.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  app.patch('/api/stories/:id/feature', requireAuth, async (req, res) => {
    return res.status(410).json({ message: 'Feature stories endpoint is no longer supported' });
  });

  app.post('/api/stories/:id/view', async (req, res) => {
    const story = data.stories.find((s) => s.id === req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const ip = getClientIp(req);
    if (data.bannedIps.some((entry) => entry.ip === ip)) {
      return res.status(403).json({ message: 'View blocked: IP address is banned' });
    }

    const viewRecord = {
      timestamp: Date.now(),
      ip,
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    story.views = (story.views || 0) + 1;
    story.viewHistory = [...(story.viewHistory || []), viewRecord];
    await saveData();
    return res.json({ views: story.views });
  });

  // Messages
  app.get('/api/messages', requireAuth, (_req, res) => {
    res.json(data.messages);
  });

  app.post('/api/messages', async (req, res) => {
    const payload = req.body || {};
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      return res.status(400).json({ message: 'All message fields are required' });
    }

    const newMessage = {
      ...payload,
      id: generateId('msg_'),
      timestamp: new Date().toISOString(),
      read: false
    };

    data.messages.unshift(newMessage);
    await saveData();
    return res.status(201).json(newMessage);
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req, res) => {
    const message = data.messages.find((m) => m.id === req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.read = true;
    await saveData();
    return res.json(message);
  });

  app.delete('/api/messages/:id', requireAuth, async (req, res) => {
    const index = data.messages.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Message not found' });
    }

    data.messages.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  // Banned IPs
  app.get('/api/banned-ips', requireAuth, (_req, res) => {
    res.json(data.bannedIps);
  });

  app.post('/api/banned-ips', requireAuth, async (req, res) => {
    const { ip, reason } = req.body || {};
    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    if (data.bannedIps.some((entry) => entry.ip === ip)) {
      return res.status(409).json({ message: 'IP address already banned' });
    }

    const entry = {
      ip,
      bannedAt: Date.now(),
      reason: reason || undefined
    };

    data.bannedIps.push(entry);
    await saveData();
    return res.status(201).json(entry);
  });

  app.delete('/api/banned-ips/:ip', requireAuth, async (req, res) => {
    const ip = decodeURIComponent(req.params.ip);
    const index = data.bannedIps.findIndex((entry) => entry.ip === ip);
    if (index === -1) {
      return res.status(404).json({ message: 'IP address not found' });
    }

    data.bannedIps.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
