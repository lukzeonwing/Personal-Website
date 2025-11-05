const express = require('express');
const { requireAuth } = require('../lib/auth');
const { getData, saveData } = require('../store');
const { normalizeProjectMedia, sanitizeProject } = require('../lib/projects');
const { generateId, sanitizeIdentifier, getClientIp, addViewRecord } = require('../lib/utils');
const { viewLimiter } = require('../middleware/rateLimiter');
const { validateRequest, projectCreateSchema, projectUpdateSchema } = require('../middleware/validation');
const { checkIpBan } = require('../middleware/ipBan');

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

  router.post('/', requireAuth, validateRequest(projectCreateSchema), async (req, res) => {
    const payload = req.body || {};

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

  router.put('/:id', requireAuth, validateRequest(projectUpdateSchema), async (req, res) => {
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
    // Set featuredAt timestamp when featuring, clear it when unfeaturing
    project.featuredAt = project.featured ? Date.now() : undefined;
    await saveData();
    return res.json(sanitizeProject(project));
  });

  router.post('/:id/view', viewLimiter, checkIpBan, async (req, res) => {
    const data = getData();
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const ip = getClientIp(req);
    const viewRecord = {
      timestamp: Date.now(),
      ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    project.views = (project.views || 0) + 1;
    project.viewHistory = addViewRecord(project.viewHistory, viewRecord);

    await saveData();
    return res.json({ views: project.views });
  });

  return router;
}

module.exports = createProjectsRouter;
