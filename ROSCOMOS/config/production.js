module.exports = {
  env: 'production',
  logLevel: 'warn',
  db: { pool: { max: 30 } },
  redis: { url: process.env.REDIS_URL },
  rateLimit: { windowMs: 60000, max: 100 },
};
