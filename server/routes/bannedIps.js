const express = require('express');
const { requireAuth } = require('../lib/auth');
const { getData, saveData } = require('../store');
const { validateRequest, bannedIpCreateSchema } = require('../middleware/validation');

function createBannedIpsRouter() {
  const router = express.Router();

  router.get('/', requireAuth, (_req, res) => {
    const data = getData();
    res.json(data.bannedIps);
  });

  router.post('/', requireAuth, validateRequest(bannedIpCreateSchema), async (req, res) => {
    const { ip, reason } = req.body || {};

    const data = getData();
    if (data.bannedIps.some((entry) => entry.ip === ip)) {
      return res.status(409).json({ message: 'IP address already banned' });
    }

    const entry = {
      ip,
      bannedAt: Date.now(),
      reason: reason || undefined,
    };

    data.bannedIps.push(entry);
    await saveData();
    return res.status(201).json(entry);
  });

  router.delete('/:ip', requireAuth, async (req, res) => {
    const data = getData();
    const ip = decodeURIComponent(req.params.ip);
    const index = data.bannedIps.findIndex((entry) => entry.ip === ip);
    if (index === -1) {
      return res.status(404).json({ message: 'IP address not found' });
    }

    data.bannedIps.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  return router;
}

module.exports = createBannedIpsRouter;
