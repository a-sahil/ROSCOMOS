const Member = require("../models/Member");
const Circle = require("../models/Circle");
const { logger } = require("../utils/logger");

const executePayoutRotation = async (circleId) => {
  const circle = await Circle.findOne({ circleId }).populate("members");
  if (!circle) throw Object.assign(new Error("Circle not found"), { statusCode: 404 });
  if (circle.status !== "active") throw Object.assign(new Error("Circle not active"), { statusCode: 400 });

  let recipient = null;
  for (let i = 0; i < circle.numberOfMembers; i++) {
    const pos = (circle.currentPayoutPos + i) % circle.numberOfMembers;
    recipient = await Member.findOne({ circle: circle._id, payoutPosition: pos, hasReceivedPayout: false, isActive: true });
    if (recipient) break;
  }
  if (!recipient) { circle.status = "completed"; await circle.save(); return { isCircleComplete: true }; }

  const payout = circle.members.filter(m => m.isActive).length * circle.contributionAmount;
  recipient.hasReceivedPayout = true;
  recipient.payoutReceivedAt = new Date();
  await recipient.save();

  circle.currentPayoutPos = recipient.payoutPosition + 1;
  const remaining = await Member.countDocuments({ circle: circle._id, hasReceivedPayout: false, isActive: true });
  if (remaining === 0) { circle.status = "completed"; logger.info(`Circle ${circleId} completed`); }
  await circle.save();

  logger.info(`Paid ${payout} FLOW to ${recipient.walletAddress}`);
  return { recipient: recipient.walletAddress, amount: payout, isCircleComplete: circle.status === "completed" };
};

module.exports = { executePayoutRotation };
