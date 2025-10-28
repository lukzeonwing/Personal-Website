const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { requireAuth } = require('../lib/auth');
const {
  getExtensionFromMime,
  generateUploadFilename,
  buildWorkshopGalleryFile,
  IMAGE_FILE_PATTERN,
} = require('../lib/uploads');
const { WORKSHOP_GALLERY_DIR } = require('../config');

function createWorkshopRouter() {
  const router = express.Router();

  router.post('/gallery', requireAuth, async (req, res) => {
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

      savedFiles.push(buildWorkshopGalleryFile(fileName));
    }

    return res.status(201).json({ files: savedFiles });
  });

  router.get('/gallery', async (_req, res) => {
    try {
      await fs.mkdir(WORKSHOP_GALLERY_DIR, { recursive: true });
      const entries = await fs.readdir(WORKSHOP_GALLERY_DIR);
      const files = entries
        .filter((filename) => IMAGE_FILE_PATTERN.test(filename))
        .sort((a, b) => a.localeCompare(b))
        .map((filename) => buildWorkshopGalleryFile(filename));

      return res.json({ files });
    } catch (error) {
      console.error('Failed to load workshop gallery images:', error);
      return res.status(500).json({ message: 'Failed to load workshop gallery images' });
    }
  });

  return router;
}

module.exports = createWorkshopRouter;
