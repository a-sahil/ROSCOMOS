const Joi = require("joi");
const schema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid("development","production","test").default("development"),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  FLOW_ACCESS_NODE: Joi.string().uri().required(),
  CONTRACT_ADDRESS: Joi.string().required()
}).unknown(true);

const { error } = schema.validate(process.env);
if (error) throw new Error(`Config invalid: ${error.message}`);
module.exports = {};
