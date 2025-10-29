const cors = require('cors');
const { ALLOWED_ORIGINS } = require('../config');
const logger = require('../lib/logger');

function configureCors() {
  const allowedOrigins = ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  
  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  });
}

module.exports = { configureCors };
