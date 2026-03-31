const Member  = require("../models/Member");
const Circle  = require("../models/Circle");

// Compound indexes for hot query paths
const applyIndexes = async () => {
  await Circle.collection.createIndex({ status: 1, createdAt: -1 });
  await Circle.collection.createIndex({ creatorAddress: 1, status: 1 });
  await Member.collection.createIndex({ circle: 1, payoutPosition: 1 });
  await Member.collection.createIndex({ circle: 1, hasReceivedPayout: 1, isActive: 1 });
};

module.exports = { applyIndexes };
