const cron = require('node-cron');
const db = require('../utils/db');
const payoutService = require('./payoutService');

const activeJobs = new Map();

async function schedulePayouts(circleId, cronExpression) {
  if (activeJobs.has(circleId)) activeJobs.get(circleId).stop();

  const job = cron.schedule(cronExpression, async () => {
    try {
      const result = await db.query(
        'SELECT * FROM circles WHERE id=$1 AND status=$2',
        [circleId, 'active']
      );
      if (!result.rows[0]) { job.stop(); activeJobs.delete(circleId); return; }
      await payoutService.executePayout(circleId);
    } catch (err) {
      console.error(`Scheduled payout failed [circle=${circleId}]:`, err.message);
    }
  });

  activeJobs.set(circleId, job);
}

function cancelSchedule(circleId) {
  if (activeJobs.has(circleId)) {
    activeJobs.get(circleId).stop();
    activeJobs.delete(circleId);
  }
}

module.exports = { schedulePayouts, cancelSchedule };
