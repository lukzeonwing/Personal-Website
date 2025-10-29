const express = require('express');
const { requireAuth } = require('../lib/auth');
const { getData, saveData } = require('../store');
const { validateRequest, categoryCreateSchema, categoryUpdateSchema } = require('../middleware/validation');

function createCategoriesRouter() {
  const router = express.Router();

  router.get('/', (_req, res) => {
    const data = getData();
    res.json(data.categories);
  });

  router.post('/', requireAuth, validateRequest(categoryCreateSchema), async (req, res) => {
    const { label } = req.body || {};

    const id = label.toLowerCase().replace(/\s+/g, '-');
    const data = getData();

    if (data.categories.some((cat) => cat.id === id)) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const newCategory = { id, label: label.trim() };
    data.categories.push(newCategory);
    await saveData();
    return res.status(201).json(newCategory);
  });

  router.put('/:id', requireAuth, validateRequest(categoryUpdateSchema), async (req, res) => {
    const data = getData();
    const category = data.categories.find((cat) => cat.id === req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { label } = req.body || {};

    category.label = label.trim();
    await saveData();
    return res.json(category);
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    const data = getData();
    if (data.categories.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last category' });
    }

    const index = data.categories.findIndex((cat) => cat.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const isInUse = data.projects.some((project) => project.category === req.params.id);
    if (isInUse) {
      return res.status(400).json({ message: 'Cannot delete category in use by projects' });
    }

    data.categories.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  return router;
}

module.exports = createCategoriesRouter;
