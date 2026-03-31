const { Pool } = require('pg');
const config = require('../../config');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class Database {
  constructor() {
    this.pool = null;
  }

  async init(retries = MAX_RETRIES) {
    try {
      this.pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
        min: 2,
        max: 20,
        connectionTimeoutMillis: 8000,
        idleTimeoutMillis: 30000,
        maxUses: 7500,
      });
      this.pool.on('error', (err) => console.error('Idle pool client error', err));
      await this.pool.query('SELECT 1');
    } catch (err) {
      if (retries > 0) {
        await sleep(RETRY_DELAY);
        return this.init(retries - 1);
      }
      throw err;
    }
  }

  async query(text, params) {
    if (!this.pool) await this.init();
    const client = await this.pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  async getPool() {
    if (!this.pool) await this.init();
    return this.pool;
  }
}

module.exports = new Database();
