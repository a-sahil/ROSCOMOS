const rateLimit = require("express-rate-limit");
const { logger } = require("../utils/logger");
const make = opts => rateLimit({
  ...opts,
  handler: (req, res) => { logger.warn(`Rate limit: ${req.ip} ${req.path}`); res.status(429).json({ success: false, error: { message: "Too many requests" } }); }
});
const globalLimiter = make({ windowMs: 15*60*1000, max: 200 });
const authLimiter   = make({ windowMs: 10*60*1000, max: 20 });
const txLimiter     = make({ windowMs: 60*1000,    max: 10 });
module.exports = { globalLimiter, authLimiter, txLimiter };
