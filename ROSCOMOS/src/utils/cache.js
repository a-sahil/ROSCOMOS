const { createClient } = require("redis");
const { logger } = require("./logger");
let client = null;
const getClient = async () => {
  if (!client) { client = createClient({ url: process.env.REDIS_URL }); client.on("error", e => logger.error("Redis:", e)); await client.connect(); }
  return client;
};
const cacheGet = async k => { try { const v = await (await getClient()).get(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const cacheSet = async (k, v, ttl=60) => { try { await (await getClient()).set(k, JSON.stringify(v), { EX: ttl }); } catch {} };
const cacheDel = async k => { try { await (await getClient()).del(k); } catch {} };
module.exports = { cacheGet, cacheSet, cacheDel };
