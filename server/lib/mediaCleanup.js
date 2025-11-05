const fs = require('fs/promises');
const path = require('path');
const { UPLOADS_DIR } = require('../config');
const { getData } = require('../store');
const logger = require('./logger');

/**
 * Recursively collect all files in a directory
 */
async function collectFiles(dirPath, basePath = dirPath) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await collectFiles(fullPath, basePath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const relativePath = path.relative(basePath, fullPath);
        files.push({
          filename: entry.name,
          path: fullPath,
          relativePath: relativePath,
          size: 0, // Will be set later
        });
      }
    }
  } catch (error) {
    logger.warn(`Failed to read directory: ${dirPath}`, { error: error.message });
  }
  
  return files;
}

/**
 * Extract all media URLs referenced in projects and stories
 */
function extractReferencedUrls() {
  const data = getData();
  const urls = new Set();
  
  // Extract from projects
  if (Array.isArray(data.projects)) {
    for (const project of data.projects) {
      // Main image
      if (project.image) urls.add(project.image);
      
      // Gallery images
      if (Array.isArray(project.gallery)) {
        project.gallery.forEach(img => urls.add(img));
      }
      
      // Hero image
      if (project.hero) urls.add(project.hero);
      
      // Description images (check for markdown image syntax)
      if (project.description) {
        const imgMatches = project.description.match(/!\[.*?\]\((.*?)\)/g);
        if (imgMatches) {
          imgMatches.forEach(match => {
            const urlMatch = match.match(/\((.*?)\)/);
            if (urlMatch) urls.add(urlMatch[1]);
          });
        }
      }
    }
  }
  
  // Extract from stories
  if (Array.isArray(data.stories)) {
    for (const story of data.stories) {
      if (story.coverImage) urls.add(story.coverImage);
      if (story.image) urls.add(story.image);
      
      // Content images
      if (story.content) {
        const imgMatches = story.content.match(/!\[.*?\]\((.*?)\)/g);
        if (imgMatches) {
          imgMatches.forEach(match => {
            const urlMatch = match.match(/\((.*?)\)/);
            if (urlMatch) urls.add(urlMatch[1]);
          });
        }
      }
    }
  }
  
  // Extract from about content
  if (data.about && data.about.heroImage) {
    urls.add(data.about.heroImage);
  }
  
  return urls;
}

/**
 * Convert URL to file path
 */
function urlToFilePath(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Handle /uploads/... URLs
  const uploadsPrefix = '/uploads/';
  if (url.startsWith(uploadsPrefix)) {
    const relativePath = url.slice(uploadsPrefix.length);
    return path.join(UPLOADS_DIR, relativePath);
  }
  
  return null;
}

/**
 * Find all unused media files
 */
async function findUnusedMedia() {
  try {
    // Collect all files in uploads directory
    const allFiles = await collectFiles(UPLOADS_DIR);
    
    // Get file sizes
    for (const file of allFiles) {
      try {
        const stats = await fs.stat(file.path);
        file.size = stats.size;
      } catch (error) {
        logger.warn(`Failed to get stats for ${file.path}`, { error: error.message });
      }
    }
    
    // Get all referenced URLs
    const referencedUrls = extractReferencedUrls();
    
    // Convert URLs to file paths
    const referencedPaths = new Set();
    for (const url of referencedUrls) {
      const filePath = urlToFilePath(url);
      if (filePath) {
        referencedPaths.add(path.normalize(filePath));
      }
    }
    
    // Find unused files
    const unusedFiles = allFiles.filter(file => {
      const normalizedPath = path.normalize(file.path);
      return !referencedPaths.has(normalizedPath);
    });
    
    // Sort by size descending
    unusedFiles.sort((a, b) => b.size - a.size);
    
    return unusedFiles.map(file => ({
      filename: file.filename,
      path: file.relativePath,
      size: file.size,
      url: `/uploads/${file.relativePath.replace(/\\/g, '/')}`,
    }));
  } catch (error) {
    logger.error('Failed to find unused media', { error: error.message });
    throw new Error('Failed to analyze media files');
  }
}

/**
 * Delete unused media files
 */
async function deleteUnusedMedia(filePaths) {
  const results = {
    deleted: [],
    failed: [],
  };
  
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return results;
  }
  
  for (const relativePath of filePaths) {
    if (!relativePath || typeof relativePath !== 'string') {
      continue;
    }
    
    // Security: ensure path is within uploads directory
    const fullPath = path.join(UPLOADS_DIR, relativePath);
    const normalized = path.normalize(fullPath);
    const uploadsNormalized = path.normalize(UPLOADS_DIR);
    
    if (!normalized.startsWith(uploadsNormalized)) {
      logger.warn('Attempted to delete file outside uploads directory', { path: relativePath });
      results.failed.push({ path: relativePath, reason: 'Invalid path' });
      continue;
    }
    
    try {
      await fs.unlink(fullPath);
      results.deleted.push(relativePath);
      logger.info('Deleted unused media file', { path: relativePath });
    } catch (error) {
      logger.warn(`Failed to delete file: ${relativePath}`, { error: error.message });
      results.failed.push({ path: relativePath, reason: error.message });
    }
  }
  
  // Clean up empty directories
  await cleanEmptyDirectories(UPLOADS_DIR);
  
  return results;
}

/**
 * Remove empty directories recursively
 */
async function cleanEmptyDirectories(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Recursively clean subdirectories first
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = path.join(dirPath, entry.name);
        await cleanEmptyDirectories(subPath);
      }
    }
    
    // Check if directory is now empty
    const updatedEntries = await fs.readdir(dirPath);
    if (updatedEntries.length === 0 && dirPath !== UPLOADS_DIR) {
      await fs.rmdir(dirPath);
      logger.info('Removed empty directory', { path: dirPath });
    }
  } catch (error) {
    logger.warn(`Failed to clean directory: ${dirPath}`, { error: error.message });
  }
}

module.exports = {
  findUnusedMedia,
  deleteUnusedMedia,
};
