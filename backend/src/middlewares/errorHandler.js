const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const message = err.expose ? err.message : (err.message || "Server error");
  res.status(status).json({ message });
};