const { normalizeUploadPath } = require('./uploads');

function normalizeProjectMedia(project) {
  if (!project || typeof project !== 'object') {
    return { project, changed: false };
  }

  let changed = false;
  const normalized = { ...project };

  if (typeof normalized.coverImage === 'string') {
    const coverImage = normalizeUploadPath(normalized.coverImage);
    if (coverImage !== normalized.coverImage) {
      normalized.coverImage = coverImage;
      changed = true;
    }
  }

  if (Array.isArray(normalized.images)) {
    const updatedImages = normalized.images.map((entry) => {
      if (typeof entry !== 'string') {
        return entry;
      }
      const normalizedEntry = normalizeUploadPath(entry);
      if (normalizedEntry !== entry) {
        changed = true;
      }
      return normalizedEntry;
    });
    normalized.images = updatedImages;
  }

  if (Array.isArray(normalized.contentBlocks)) {
    const updatedBlocks = normalized.contentBlocks.map((block) => {
      if (!block || typeof block !== 'object') {
        return block;
      }
      
      let blockChanged = false;
      const newBlock = { ...block };

      if (typeof block.image === 'string') {
        const normalizedImage = normalizeUploadPath(block.image);
        if (normalizedImage !== block.image) {
          newBlock.image = normalizedImage;
          blockChanged = true;
        }
      }

      if (typeof block.video === 'string') {
        const normalizedVideo = normalizeUploadPath(block.video);
        if (normalizedVideo !== block.video) {
          newBlock.video = normalizedVideo;
          blockChanged = true;
        }
      }

      if (blockChanged) {
        changed = true;
        return newBlock;
      }
      
      return block;
    });
    normalized.contentBlocks = updatedBlocks;
  }

  return {
    project: changed ? normalized : project,
    changed,
  };
}

function sanitizeProject(project) {
  if (!project) {
    return project;
  }
  return {
    ...project,
    viewHistory: project.viewHistory || [],
  };
}

module.exports = {
  normalizeProjectMedia,
  sanitizeProject,
};
