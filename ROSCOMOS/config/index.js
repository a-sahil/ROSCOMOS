require('dotenv').config();

const base = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'roscomos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  flow: {
    network: process.env.FLOW_NETWORK || 'testnet',
    contractAddress: process.env.CONTRACT_ADDRESS || '0xa89655a0f8e3d113',
    adminAddress: process.env.ADMIN_ADDRESS,
  },
  webhookSecret: process.env.WEBHOOK_SECRET,
};

if (base.env === 'production') {
  const required = ['JWT_SECRET', 'DB_PASSWORD', 'WEBHOOK_SECRET', 'ADMIN_ADDRESS'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

const envOverrides = require(`./${base.env}`);
module.exports = { ...base, ...envOverrides };
