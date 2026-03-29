const Log = require('../models/Log.model');

const logMiddleware = async (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.on('finish', async () => {
      try {
        const userId = req.user ? req.user._id : null;
        const logEntry = {
          user: userId,
          action: `${req.method} ${req.originalUrl}`,
          details: {
            body: req.body,
            query: req.query,
            params: req.params,
            statusCode: res.statusCode
          }
        };
        await Log.create(logEntry);
      } catch (error) {
        console.error('Error recording action log:', error);
      }
    });
  }
  
  next();
};

module.exports = logMiddleware;
