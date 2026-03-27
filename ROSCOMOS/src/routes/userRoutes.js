const { Router } = require('express');
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = Router();
router.get('/:address/profile', auth, ctrl.getUserProfile);
router.get('/:address/circles', auth, ctrl.getUserCircles);

module.exports = router;
