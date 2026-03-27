const crypto = require('crypto');
const db = require('../utils/db');

async function handleEvent(req, res) {
  try {
    const sig = req.headers['x-roscomos-signature'];
    const secret = process.env.WEBHOOK_SECRET || '';
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (sig !== expected) return res.status(403).json({ success: false, error: 'Invalid signature' });

    const { type, circleId, data } = req.body;
    await db.query(
      'INSERT INTO webhook_events (type, circle_id, payload, received_at) VALUES ($1,$2,$3,NOW())',
      [type, circleId, JSON.stringify(data)]
    );
    res.json({ success: true, message: 'Event recorded' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { handleEvent };
