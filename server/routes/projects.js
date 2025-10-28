const express = require('express');
const { requireAuth } = require('../lib/auth');
const { getData, saveData } = require('../store');
const { normalizeProjectMedia, sanitizeProject } = require('../lib/projects');
const { generateId, sanitizeIdentifier, getClientIp } = require('../lib/utils');

function createProjectsRouter() {
  const router = express.Router();

  router.get('/', (_req, res) => {
    const data = getData();
    const projects = data.projects.map(sanitizeProject);
    res.json(projects);
  });

  router.get('/:id', (req, res) => {
    const data = getData();
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.json(sanitizeProject(project));
  });

  router.post('/', requireAuth, async (req, res) => {
    const payload = req.body || {};
    if (!payload.title || !payload.description || !payload.category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const providedId = typeof payload.id === 'string' ? sanitizeIdentifier(payload.id) : '';
    const projectId = providedId || generateId('proj_');

    const newProjectBase = {
      ...payload,
      id: projectId,
      views: payload.views ?? 0,
      viewHistory: [],
      featured: Boolean(payload.featured),
    };

    const { project: newProject } = normalizeProjectMedia(newProjectBase);

    const data = getData();
    data.projects.push(newProject);
    await saveData();
    return res.status(201).json(sanitizeProject(newProject));
  });

  router.put('/:id', requireAuth, async (req, res) => {
    const data = getData();
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existing = data.projects[index];
    const updates = req.body || {};

    const updatedProjectBase = {
      ...existing,
      ...updates,
      id: existing.id,
      viewHistory: existing.viewHistory || [],
    };

    const { project: updatedProject } = normalizeProjectMedia(updatedProjectBase);

    data.projects[index] = updatedProject;
    await saveData();
    return res.json(sanitizeProject(updatedProject));
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    const data = getData();
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }

    data.projects.splice(index, 1);
    await saveData();
    return res.status(204).send();
  });

  router.patch('/:id/feature', requireAuth, async (req, res) => {
    const data = getData();
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.featured = !project.featured;
    await saveData();
    return res.json(sanitizeProject(project));
  });

  router.post('/:id/view', async (req, res) => {
    const data = getData();
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const ip = getClientIp(req);
    if (data.bannedIps.some((entry) => entry.ip === ip)) {
      return res.status(403).json({ message: 'View blocked: IP address is banned' });
    }

    const viewRecord = {
      timestamp: Date.now(),
      ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    project.views = (project.views || 0) + 1;
    project.viewHistory = [...(project.viewHistory || []), viewRecord];

    await saveData();
    return res.json({ views: project.views });
  });

  return router;
}

module.exports = createProjectsRouter;
