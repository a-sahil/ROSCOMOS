const Member = require("../models/Member");
const Circle = require("../models/Circle");
const { logger } = require("../utils/logger");

const registerMember = async ({ circleId, walletAddress }) => {
  const circle = await Circle.findOne({ circleId });
  if (!circle) throw Object.assign(new Error("Circle not found"), { statusCode: 404 });
  if (circle.status !== "pending") throw Object.assign(new Error("Circle not accepting members"), { statusCode: 400 });
  if (circle.members.length >= circle.numberOfMembers) throw Object.assign(new Error("Circle full"), { statusCode: 400 });

  const dup = await Member.findOne({ circle: circle._id, walletAddress: walletAddress.toLowerCase() });
  if (dup) throw Object.assign(new Error("Already a member"), { statusCode: 409 });

  const member = await Member.create({
    walletAddress: walletAddress.toLowerCase(), circle: circle._id, payoutPosition: circle.members.length
  });
  circle.members.push(member._id);
  if (circle.members.length >= circle.numberOfMembers) {
    circle.status = "active";
    circle.nextPayoutAt = new Date(Date.now() + circle.cycleDurationDays * 86400000);
    logger.info(`Circle ${circleId} now active`);
  }
  await circle.save();
  return member;
};

module.exports = { registerMember };
