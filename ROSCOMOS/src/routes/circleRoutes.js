const { Router } = require('express');
const ctrl = require('../controllers/circleController');
const auth = require('../middleware/auth');

const router = Router();
router.get('/', ctrl.listCircles);
router.get('/:id', ctrl.getCircle);
router.post('/', auth, ctrl.createCircle);

module.exports = router;
