const express = require('express');
const { requireAuth } = require('../lib/auth');
const { getData, saveData } = require('../store');
const { sanitizeAboutContent, sanitizeContactContent } = require('../lib/sanitizers');
const logger = require('../lib/logger');

function createContentRouter() {
  const router = express.Router();

  router.get('/about', (_req, res) => {
    const data = getData();
    res.json(data.about);
  });

  router.put('/about', requireAuth, async (req, res) => {
    const payload = req.body || {};
    try {
      const sanitized = sanitizeAboutContent(payload);
      const data = getData();
      data.about = sanitized;
      await saveData();
      return res.json(data.about);
    } catch (error) {
      logger.error('Failed to update about content', { error: error.message });
      return res.status(400).json({ message: 'Invalid about content payload' });
    }
  });

  router.get('/contact', (_req, res) => {
    const data = getData();
    res.json(data.contact);
  });

  router.put('/contact', requireAuth, async (req, res) => {
    const payload = req.body || {};
    try {
      const sanitized = sanitizeContactContent(payload);
      const data = getData();
      data.contact = sanitized;
      await saveData();
      return res.json(data.contact);
    } catch (error) {
      logger.error('Failed to update contact content', { error: error.message });
      return res.status(400).json({ message: 'Invalid contact content payload' });
    }
  });

  return router;
}

module.exports = createContentRouter;
