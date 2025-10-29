// Maximum number of view history records to keep per item
const MAX_VIEW_HISTORY = 1000;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function generateId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '0.0.0.0';
}

function sanitizeIdentifier(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Add a view record and limit history size to prevent memory leaks
 */
function addViewRecord(viewHistory, newRecord) {
  const updated = [...(viewHistory || []), newRecord];
  // Keep only the most recent MAX_VIEW_HISTORY records
  return updated.slice(-MAX_VIEW_HISTORY);
}

module.exports = {
  clone,
  generateId,
  getClientIp,
  sanitizeIdentifier,
  addViewRecord,
  MAX_VIEW_HISTORY,
};
