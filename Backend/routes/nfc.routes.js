const express = require('express');
const router = express.Router();
const nfcController = require('../controllers/nfc.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Test endpoint for NFC tag reading
router.post('/read', nfcController.testNfcRead);

// Test endpoint for NFC-based authentication
router.post('/authenticate', nfcController.nfcAuthenticate);

// NFC Tap-In
router.post('/tapin', auth, nfcController.nfcTapIn);

// NFC Tap-Out
router.post('/tapout', auth, nfcController.nfcTapOut);

module.exports = router;