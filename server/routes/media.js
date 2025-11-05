const express = require('express');
const { requireAuth } = require('../lib/auth');
const { findUnusedMedia, deleteUnusedMedia } = require('../lib/mediaCleanup');
const { asyncHandler } = require('../middleware/asyncHandler');
const logger = require('../lib/logger');

function createMediaRouter() {
  const router = express.Router();

  // GET /api/media/unused - List all unused media files
  router.get(
    '/unused',
    requireAuth,
    asyncHandler(async (req, res) => {
      logger.info('Finding unused media files');
      const unusedFiles = await findUnusedMedia();
      
      const totalSize = unusedFiles.reduce((sum, file) => sum + file.size, 0);
      
      res.json({
        files: unusedFiles,
        count: unusedFiles.length,
        totalSize: totalSize,
      });
    })
  );

  // POST /api/media/unused/delete - Delete specified unused media files
  router.post(
    '/unused/delete',
    requireAuth,
    asyncHandler(async (req, res) => {
      const { files } = req.body;
      
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: 'No files specified for deletion' });
      }
      
      logger.info(`Deleting ${files.length} unused media files`);
      const results = await deleteUnusedMedia(files);
      
      res.json({
        message: `Deleted ${results.deleted.length} file(s)`,
        deleted: results.deleted,
        failed: results.failed,
      });
    })
  );

  return router;
}

module.exports = createMediaRouter;
