const express = require('express');
const { requireAuth } = require('../lib/auth');
const { getData, saveData } = require('../store');
const { generateId } = require('../lib/utils');

function createMessagesRouter() {
  const router = express.Router();

  router.get('/', requireAuth, (_req, res) => {
    const data = getData();
    res.json(data.messages);
  });

  router.post('/', async (req, res) => {
    const payload = req.body || {};
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      return res.status(400).json({ message: 'All message fields are required' });
    }

    const newMessage = {
      ...payload,
      id: generateId('msg_'),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const data = getData();
    data.messages.unshift(newMessage);
    await saveData();
    return res.status(201).json(newMessage);
  });

  router.patch('/:id/read', requireAuth, async (req, res) => {
    const data = getData();
    const message = data.messages.find((m) => m.id === req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.read = true;
    await saveData();
    return res.json(message);
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    const data = getData();
    const index = data.messages.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Message not found' });
    }

    data.messages.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  return router;
}

module.exports = createMessagesRouter;
