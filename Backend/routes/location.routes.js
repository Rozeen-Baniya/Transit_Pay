const router = require('express').Router();
const { auth } = require('../middlewares/auth.middleware');
const locationController = require('../controllers/location.controller');

// Get location of specific transport
router.get('/transport/:transportId', auth, locationController.getTransportLocation);

// Get all active transports
router.get('/active', auth, locationController.getActiveTransports);

// Get nearby transports
router.get('/nearby', auth, locationController.getNearbyTransports);

module.exports = router;