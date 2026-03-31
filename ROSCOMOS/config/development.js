module.exports = {
  env: 'development',
  logLevel: 'debug',
  db: { pool: { max: 5 } },
  redis: { url: 'redis://localhost:6379' },
  rateLimit: { windowMs: 60000, max: 500 },
};
