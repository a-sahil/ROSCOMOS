const os = require("os");
const mongoose = require("mongoose");
const { asyncHandler } = require("../utils/asyncHandler");

module.exports = asyncHandler(async (_req, res) => {
  const dbState = ["disconnected","connected","connecting","disconnecting"][mongoose.connection.readyState] || "unknown";
  res.json({
    status: "ok",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    db: dbState,
    hostname: os.hostname(),
    ts: new Date().toISOString()
  });
});
