const { v4: uuidv4 } = require("uuid");
const Circle = require("../models/Circle");
const Member = require("../models/Member");
const { logger } = require("../utils/logger");
const { cacheGet, cacheSet, cacheDel } = require("../utils/cache");
const TTL = 120;

const createCircle = async ({ name, numberOfMembers, contributionAmount, cycleDurationDays, creatorAddress }) => {
  const exists = await Circle.findOne({ name: name.trim(), creatorAddress, status: { $ne: "cancelled" } });
  if (exists) throw Object.assign(new Error("Circle name already used"), { statusCode: 409 });
  const circle = await Circle.create({ circleId: uuidv4(), name: name.trim(), numberOfMembers, contributionAmount, cycleDurationDays, creatorAddress, contractAddress: process.env.CONTRACT_ADDRESS });
  const member = await Member.create({ walletAddress: creatorAddress, circle: circle._id, payoutPosition: 0 });
  circle.members.push(member._id); await circle.save();
  await cacheDel(`circles:list:all:1:20`);
  logger.info(`Circle ${circle.circleId} created`); return circle;
};

const getCircleById = async (circleId) => {
  const key = `circle:${circleId}`;
  const hit = await cacheGet(key);
  if (hit) return hit;
  const c = await Circle.findOne({ circleId }).populate("members");
  if (!c) throw Object.assign(new Error("Circle not found"), { statusCode: 404 });
  await cacheSet(key, c, TTL); return c;
};

const listCircles = async ({ status, page = 1, limit = 20 }) => {
  const key = `circles:list:${status||"all"}:${page}:${limit}`;
  const hit = await cacheGet(key);
  if (hit) return hit;
  const q = status ? { status } : {};
  const [circles, total] = await Promise.all([Circle.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit), Circle.countDocuments(q)]);
  const result = { circles, total, page, pages: Math.ceil(total/limit) };
  await cacheSet(key, result, TTL); return result;
};

module.exports = { createCircle, getCircleById, listCircles };
