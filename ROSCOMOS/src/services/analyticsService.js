const Circle = require("../models/Circle");
const Member = require("../models/Member");
const { logger } = require("../utils/logger");

const getStats = async () => {
  const [totalCircles, activeCircles, completedCircles, totalMembers] = await Promise.all([
    Circle.countDocuments(),
    Circle.countDocuments({ status: "active" }),
    Circle.countDocuments({ status: "completed" }),
    Member.countDocuments()
  ]);
  return { totalCircles, activeCircles, completedCircles, totalMembers };
};

const getCircleHealth = async (circleId) => {
  const circle = await Circle.findOne({ circleId }).populate("members");
  if (!circle) throw Object.assign(new Error("Circle not found"), { statusCode: 404 });
  const activeMembers = circle.members.filter(m => m.isActive).length;
  const missedTotal   = circle.members.reduce((s, m) => s + (m.missedCycles || 0), 0);
  return { circleId, status: circle.status, activeMembers, missedTotal, currentCycle: circle.currentCycle };
};

module.exports = { getStats, getCircleHealth };
