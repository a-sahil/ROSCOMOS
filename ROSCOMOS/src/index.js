require("dotenv").config();
const express   = require("express");
const helmet    = require("helmet");
const cors      = require("cors");
const { connectDB }       = require("./utils/database");
const { logger }          = require("./utils/logger");
const { applyIndexes }    = require("./utils/indexes");
const errorHandler        = require("./middleware/errorHandler");
const { globalLimiter }   = require("./middleware/rateLimiter");
const { sanitize }        = require("./middleware/sanitize");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "10kb" }));
app.use(globalLimiter);
app.use(sanitize);

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

// Centralized route registration
[
  ["/api/circles",  require("./routes/circles")],
  ["/api/members",  require("./routes/members")],
  ["/api/admin",    require("./routes/admin")]
].forEach(([path, router]) => app.use(path, router));

app.use(errorHandler);

const start = async () => {
  await connectDB();
  await applyIndexes();
  app.listen(PORT, () => logger.info(`ROSCOMOS running on port ${PORT}`));
};

start().catch(e => { logger.error("Fatal startup error:", e); process.exit(1); });
module.exports = app;
