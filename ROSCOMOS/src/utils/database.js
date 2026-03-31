const mongoose = require("mongoose");
const { logger } = require("./logger");
const connectDB = async (retries = 5) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info("MongoDB connected");
      return;
    } catch (e) {
      logger.warn(`DB connect attempt ${i} failed`);
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};
module.exports = { connectDB };
