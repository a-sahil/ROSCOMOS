const Member = require("../models/Member");
const Circle = require("../models/Circle");
const { logger } = require("../utils/logger");

const processContribution = async ({ circleId, walletAddress, amount, txHash }) => {
  const circle = await Circle.findOne({ circleId });
  if (!circle) throw Object.assign(new Error("Circle not found"), { statusCode: 404 });
  if (circle.status !== "active") throw Object.assign(new Error("Circle not active"), { statusCode: 400 });
  if (Math.abs(amount - circle.contributionAmount) > 0.0001)
    throw Object.assign(new Error(`Must contribute exactly ${circle.contributionAmount} FLOW`), { statusCode: 400 });

  const member = await Member.findOne({ circle: circle._id, walletAddress: walletAddress.toLowerCase() });
  if (!member) throw Object.assign(new Error("Not a member"), { statusCode: 403 });
  if (member.contributions.some(c => c.cycle === circle.currentCycle))
    throw Object.assign(new Error("Already contributed this cycle"), { statusCode: 409 });

  member.contributions.push({ cycle: circle.currentCycle, amount, txHash });
  member.totalContributed += amount;
  await member.save();
  circle.totalContributed += amount;

  const members = await Member.find({ circle: circle._id, isActive: true });
  const allPaid = members.every(m => m.contributions.some(c => c.cycle === circle.currentCycle));
  if (allPaid) {
    circle.currentCycle += 1;
    logger.info(`All contributed â€” advancing circle ${circleId} to cycle ${circle.currentCycle}`);
  }
  await circle.save();
  return { status: allPaid ? "cycle_advanced" : "contribution_recorded" };
};

module.exports = { processContribution };
