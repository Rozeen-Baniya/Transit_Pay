const router = require('express').Router();
const { auth } = require('../middlewares/auth.middleware');
const tripController = require('../controllers/trip.controller');

router.post('/', tripController.handleTripStatus)
router.get('/:userId', tripController.getTrips)

module.exports = router;
