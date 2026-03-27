const circleService = require("../services/circleService");
const { asyncHandler } = require("../utils/asyncHandler");

const createCircle = asyncHandler(async (req, res) => {
  const circle = await circleService.createCircle({ ...req.body, creatorAddress: req.user.walletAddress });
  res.status(201).json({ success: true, data: circle });
});
const listCircles  = asyncHandler(async (req, res) => res.json({ success: true, ...(await circleService.listCircles(req.query)) }));
const getCircle    = asyncHandler(async (req, res) => res.json({ success: true, data: await circleService.getCircleById(req.params.circleId) }));
module.exports = { createCircle, listCircles, getCircle };
