const router = require('express').Router();
const transportController = require('../controllers/transport.controller');

// Register a new transport
router.post('/register', transportController.registerTransport);



module.exports = router;