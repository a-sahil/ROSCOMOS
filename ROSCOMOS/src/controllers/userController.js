const db = require('../utils/db');

async function getUserProfile(req, res) {
  try {
    const { address } = req.params;
    const result = await db.query(
      'SELECT address, created_at FROM users WHERE address=$1',
      [address]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getUserCircles(req, res) {
  try {
    const { address } = req.params;
    const result = await db.query(
      `SELECT c.* FROM circles c
       JOIN circle_members cm ON c.id = cm.circle_id
       WHERE cm.member_address=$1 ORDER BY cm.joined_at DESC`,
      [address]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getUserProfile, getUserCircles };
