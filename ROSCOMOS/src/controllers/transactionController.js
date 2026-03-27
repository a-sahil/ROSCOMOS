const contributionService = require("../services/contributionService");
const payoutService       = require("../services/payoutService");
const { asyncHandler }    = require("../utils/asyncHandler");

const contribute = asyncHandler(async (req, res) => {
  const result = await contributionService.processContribution({
    circleId: req.params.circleId,
    walletAddress: req.user.walletAddress,
    amount: req.body.amount,
    txHash: req.body.txHash
  });
  res.json({ success: true, data: result });
});

const payout = asyncHandler(async (req, res) => {
  const result = await payoutService.executePayoutRotation(req.params.circleId);
  res.json({ success: true, data: result });
});

module.exports = { contribute, payout };
