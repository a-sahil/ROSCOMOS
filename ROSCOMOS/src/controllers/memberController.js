const memberService = require("../services/memberService");
const { asyncHandler } = require("../utils/asyncHandler");
const joinCircle = asyncHandler(async (req, res) => {
  const member = await memberService.registerMember({ circleId: req.params.circleId, walletAddress: req.user.walletAddress });
  res.status(201).json({ success: true, data: member });
});
module.exports = { joinCircle };
