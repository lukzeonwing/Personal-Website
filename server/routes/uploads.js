const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { requireAuth } = require('../lib/auth');
const { sanitizeIdentifier } = require('../lib/utils');
const {
  getExtensionFromMime,
  generateUploadFilename,
  buildUploadsRelativePath,
} = require('../lib/uploads');
const { UPLOADS_DIR } = require('../config');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateRequest, uploadSchema } = require('../middleware/validation');
const logger = require('../lib/logger');

function createUploadsRouter() {
  const router = express.Router();

  router.post('/', uploadLimiter, requireAuth, validateRequest(uploadSchema), async (req, res) => {
    const { data, filename, entityType, entityId } = req.body || {};

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

    const match = data.match(/^data:((?:image|video)\/[a-zA-Z0-9+.\-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    const [, mimeType, base64String] = match;
    if (!base64String) {
      return res.status(400).json({ message: 'Invalid file data' });
    }

    const buffer = Buffer.from(base64String, 'base64');
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ message: 'Empty file data' });
    }

    const extension = getExtensionFromMime(mimeType);
    const fileName = generateUploadFilename(extension, filename);
    const entityDir = path.join(UPLOADS_DIR, resolvedType, safeEntityId);

    try {
      await fs.mkdir(entityDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to prepare upload directory', { error: error.message, entityType: resolvedType, entityId: safeEntityId });
      return res.status(500).json({ message: 'Failed to prepare upload directory' });
    }

    const filePath = path.join(entityDir, fileName);

    try {
      await fs.writeFile(filePath, buffer);
    } catch (error) {
      logger.error('Failed to save uploaded image', { error: error.message, filePath });
      return res.status(500).json({ message: 'Failed to store image' });
    }

    const relativePath = buildUploadsRelativePath(resolvedType, safeEntityId, fileName);
    return res.status(201).json({ url: relativePath });
  });

  return router;
}

module.exports = createUploadsRouter;
