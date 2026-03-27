const express = require("express");
const r = express.Router();
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/rbac");
const { asyncHandler } = require("../utils/asyncHandler");
const { getStats, getCircleHealth } = require("../services/analyticsService");

r.get("/stats",              authenticate, requireAdmin, asyncHandler(async (_req, res) => res.json({ success:true, data: await getStats() })));
r.get("/circles/:id/health", authenticate, requireAdmin, asyncHandler(async (req,  res) => res.json({ success:true, data: await getCircleHealth(req.params.id) })));
module.exports = r;
