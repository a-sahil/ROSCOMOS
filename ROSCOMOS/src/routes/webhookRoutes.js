const { Router } = require('express');
const { handleEvent } = require('../controllers/webhookController');

const router = Router();
router.post('/events', handleEvent);

module.exports = router;
