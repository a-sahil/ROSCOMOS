const db = require('../utils/db');

async function findById(circleId) {
  const res = await db.query('SELECT * FROM circles WHERE id=$1', [circleId]);
  return res.rows[0] || null;
}

async function findAll({ limit = 20, offset = 0 } = {}) {
  const res = await db.query(
    `SELECT c.*, COUNT(cm.member_address) AS member_count
     FROM circles c
     LEFT JOIN circle_members cm ON c.id = cm.circle_id
     GROUP BY c.id
     ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

async function findByCreator(creatorAddress) {
  const res = await db.query(
    'SELECT * FROM circles WHERE creator_address=$1 ORDER BY created_at DESC',
    [creatorAddress]
  );
  return res.rows;
}

async function batchFindByIds(ids) {
  if (!ids.length) return [];
  const res = await db.query(
    'SELECT * FROM circles WHERE id = ANY($1::uuid[])',
    [ids]
  );
  return res.rows;
}

async function create({ numberOfMembers, contributionAmount, cycleDuration, creatorAddress }) {
  const res = await db.query(
    `INSERT INTO circles (number_of_members, contribution_amount, cycle_duration, creator_address, status, created_at)
     VALUES ($1,$2,$3,$4,'active',NOW()) RETURNING *`,
    [numberOfMembers, contributionAmount, cycleDuration, creatorAddress]
  );
  return res.rows[0];
}

async function updateStatus(circleId, status) {
  const res = await db.query(
    'UPDATE circles SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [status, circleId]
  );
  return res.rows[0];
}

module.exports = { findById, findAll, findByCreator, batchFindByIds, create, updateStatus };
