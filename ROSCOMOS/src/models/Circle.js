const { Schema, model } = require("mongoose");
const circleSchema = new Schema({
  circleId:          { type: String, required: true, unique: true, index: true },
  name:              { type: String, required: true, trim: true, maxlength: 100 },
  numberOfMembers:   { type: Number, required: true, min: 2, max: 50 },
  contributionAmount:{ type: Number, required: true, min: 0.01 },
  cycleDurationDays: { type: Number, required: true, min: 1 },
  currentCycle:      { type: Number, default: 0 },
  currentPayoutPos:  { type: Number, default: 0 },
  status:            { type: String, enum: ["pending","active","completed","cancelled"], default: "pending" },
  creatorAddress:    { type: String, required: true },
  members:           [{ type: Schema.Types.ObjectId, ref: "Member" }],
  totalContributed:  { type: Number, default: 0 }
}, { timestamps: true });

circleSchema.index({ status: 1, createdAt: -1 });
module.exports = model("Circle", circleSchema);
