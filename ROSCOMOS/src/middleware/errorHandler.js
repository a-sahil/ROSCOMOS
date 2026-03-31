const { logger } = require("../utils/logger");
module.exports = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  logger.error({ msg: err.message, path: req.path, status });
  res.status(status).json({ success: false, error: { message: err.message || "Server Error" } });
};
