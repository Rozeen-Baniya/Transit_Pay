const router = require('express').Router();
const locationController = require('../controllers/location.controller');

// Get location of specific transport
router.get('/transport/:transportId',  locationController.getTransportLocation);

// Get all active transports
router.get('/active',  locationController.getActiveTransports);

// Get nearby transports
router.get('/nearby',  locationController.getNearbyTransports);

module.exports = router;