const express = require('express');

function createHealthRouter() {
  const router = express.Router();

  router.get('/', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}

module.exports = createHealthRouter;
