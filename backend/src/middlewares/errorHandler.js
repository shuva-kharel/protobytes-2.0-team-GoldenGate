// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error(err); // log once
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
};