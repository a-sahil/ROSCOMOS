const fcl = require("@onflow/fcl");
const { logger } = require("../utils/logger");

const MAX_RETRIES = 3;
const BACKOFF_MS  = 1500;

const sendTransaction = async (code, args, authz, retries = MAX_RETRIES) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const txId = await fcl.mutate({ cadence: code, args, proposer: authz, payer: authz, authorizations: [authz], limit: 999 });
      const result = await fcl.tx(txId).onceSealed();
      logger.info(`TX sealed: ${txId}`);
      return result;
    } catch (e) {
      logger.warn(`TX attempt ${i}/${retries} failed: ${e.message}`);
      if (i === retries) throw Object.assign(e, { statusCode: 502 });
      await new Promise(r => setTimeout(r, BACKOFF_MS * i));
    }
  }
};

module.exports = { sendTransaction };
