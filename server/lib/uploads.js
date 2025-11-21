const fs = require('fs');
const path = require('path');
const {
  UPLOADS_DIR,
  UPLOADS_WEB_ROOT,
  WORKSHOP_GALLERY_WEB_PATH,
} = require('../config');

const IMAGE_FILE_PATTERN = /\.(jpe?g|png|gif|webp|avif|heic)$/i;

function getExtensionFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov',
  };
  if (map[mime]) {
    return map[mime];
  }
  const [, subtype] = mime.split('/');
  if (!subtype) return 'bin';
  return subtype.replace('+xml', '').replace('+', '.');
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

function normalizeUploadPath(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  if (trimmed.startsWith(`${UPLOADS_WEB_ROOT}/`)) {
    return trimmed;
  }

  const uploadsIndex = trimmed.indexOf(`${UPLOADS_WEB_ROOT}/`);
  if (uploadsIndex === -1) {
    return trimmed;
  }

  const candidate = trimmed.slice(uploadsIndex);
  const relativePart = candidate.slice(UPLOADS_WEB_ROOT.length + 1);
  if (!relativePart || relativePart.includes('..')) {
    return trimmed;
  }

  const absolutePath = path.join(UPLOADS_DIR, relativePart);
  const resolved = path.resolve(absolutePath);
  if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) {
    return trimmed;
  }

  if (fs.existsSync(resolved)) {
    return candidate;
  }

  return trimmed;
}

function buildUploadsRelativePath(resolvedType, entityId, filename) {
  return `${UPLOADS_WEB_ROOT}/${resolvedType}/${entityId}/${filename}`;
}

function buildWorkshopGalleryFile(filename) {
  const encoded = encodeURIComponent(filename);
  return {
    filename,
    url: `${WORKSHOP_GALLERY_WEB_PATH}/${encoded}`,
  };
}

module.exports = {
  IMAGE_FILE_PATTERN,
  generateUploadFilename,
  getExtensionFromMime,
  normalizeUploadPath,
  buildUploadsRelativePath,
  buildWorkshopGalleryFile,
};
