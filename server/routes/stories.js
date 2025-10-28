const express = require('express');
const { requireAuth } = require('../lib/auth');
const { getData, saveData } = require('../store');
const { generateId, sanitizeIdentifier } = require('../lib/utils');

function createStoriesRouter() {
  const router = express.Router();

  router.get('/', (_req, res) => {
    const data = getData();
    res.json(data.stories);
  });

  router.get('/:id', (req, res) => {
    const data = getData();
    const story = data.stories.find((s) => s.id === req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    return res.json(story);
  });

  router.post('/', requireAuth, async (req, res) => {
    const payload = req.body || {};
    if (!payload.title || !payload.description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const providedId = typeof payload.id === 'string' ? sanitizeIdentifier(payload.id) : '';
    const storyId = providedId || generateId('story_');

    const { contentBlocks = [], views = 0, featured: _deprecatedFeatured, ...storyData } = payload;

    const newStory = {
      ...storyData,
      id: storyId,
      views,
      contentBlocks,
    };

    const data = getData();
    data.stories.push(newStory);
    await saveData();
    return res.status(201).json(newStory);
  });

  router.put('/:id', requireAuth, async (req, res) => {
    const data = getData();
    const index = data.stories.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const existing = data.stories[index];
    const payload = req.body || {};
    const { id: _ignoredId, views: _ignoredViews, ...updateData } = payload;

    const updatedStory = {
      ...existing,
      ...updateData,
      id: existing.id,
    };

    data.stories[index] = updatedStory;
    await saveData();
    return res.json(updatedStory);
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    const data = getData();
    const index = data.stories.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Story not found' });
    }

    data.stories.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  router.patch('/:id/feature', requireAuth, async (_req, res) => {
    return res.status(410).json({ message: 'Feature stories endpoint is no longer supported' });
  });

  router.post('/:id/view', async (req, res) => {
    const data = getData();
    const story = data.stories.find((s) => s.id === req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    story.views = (story.views || 0) + 1;
    await saveData();
    return res.json({ views: story.views });
  });

  return router;
}

module.exports = createStoriesRouter;
