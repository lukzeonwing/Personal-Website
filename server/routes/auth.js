const express = require('express');
const { ADMIN_USERNAME, ADMIN_PASSWORD } = require('../config');
const { requireAuth, hashPassword, verifyPassword, createAdminToken } = require('../lib/auth');
const { getData, saveData } = require('../store');

function createAuthRouter() {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const providedUsername = String(username).trim();
    if (providedUsername !== ADMIN_USERNAME) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const data = getData();
    let isValid = verifyPassword(password, data.adminPasswordHash);

    if (!isValid && password === ADMIN_PASSWORD) {
      isValid = true;
      data.adminPasswordHash = hashPassword(ADMIN_PASSWORD);
      await saveData();
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createAdminToken();
    return res.json({ token });
  });

  router.get('/me', requireAuth, (_req, res) => {
    return res.json({ role: 'admin' });
  });

  router.put('/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const data = getData();
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

  return router;
}

module.exports = createAuthRouter;
