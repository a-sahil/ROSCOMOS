const { Schema, model } = require("mongoose");
const contribSchema = new Schema({
  cycle: Number, amount: Number, txHash: String, paidAt: { type: Date, default: Date.now }
});
const memberSchema = new Schema({
  walletAddress:    { type: String, required: true, lowercase: true, index: true },
  circle:           { type: Schema.Types.ObjectId, ref: "Circle", required: true },
  payoutPosition:   { type: Number, required: true },
  hasReceivedPayout:{ type: Boolean, default: false },
  payoutReceivedAt: Date,
  contributions:    [contribSchema],
  totalContributed: { type: Number, default: 0 },
  missedCycles:     { type: Number, default: 0 },
  isActive:         { type: Boolean, default: true }
}, { timestamps: true });
memberSchema.index({ circle: 1, walletAddress: 1 }, { unique: true });
module.exports = model("Member", memberSchema);
