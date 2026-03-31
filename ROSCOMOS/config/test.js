module.exports = {
  env: 'test',
  logLevel: 'error',
  db: { pool: { max: 2 } },
  redis: { url: 'redis://localhost:6379/1' },
};
