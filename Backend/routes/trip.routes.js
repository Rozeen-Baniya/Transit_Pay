const router = require('express').Router();
const { auth } = require('../middlewares/auth.middleware');
const tripController = require('../controllers/trip.controller');

// User boards a bus
router.post('/board', auth, tripController.boardBus);

// User exits a bus
router.post('/exit', auth, tripController.exitBus);

module.exports = router;
