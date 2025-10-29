const { getData } = require('../store');
const { getClientIp } = require('../lib/utils');
const logger = require('../lib/logger');

/**
 * Middleware to check if an IP address is banned
 * Blocks request if IP is in the banned list
 */
function checkIpBan(req, res, next) {
  const data = getData();
  const ip = getClientIp(req);
  
  const banned = data.bannedIps.some((entry) => entry.ip === ip);
  
  if (banned) {
    logger.warn('Blocked request from banned IP', { 
      ip, 
      path: req.path,
      method: req.method 
    });
    return res.status(403).json({ message: 'Access forbidden: IP address is banned' });
  }
  
  next();
}

module.exports = { checkIpBan };
