const Joi = require("joi");
const createCircleSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  numberOfMembers: Joi.number().integer().min(2).max(50).required(),
  contributionAmount: Joi.number().positive().required(),
  cycleDurationDays: Joi.number().integer().min(1).max(365).required()
});
module.exports = { createCircleSchema };
