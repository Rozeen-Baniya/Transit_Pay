const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const tripController = require('./trip.controller'); // Import trip controller
const Route = require('../models/route.model');
const Transport = require('../models/transport.model');

// Test endpoint for NFC tag reading
exports.testNfcRead = async (req, res) => {
    try {
        const { nfcId, phoneId } = req.body;
        
        if (!nfcId || !phoneId) {
            return res.status(400).json({
                success: false,
                message: 'NFC ID and Phone ID are required'
            });
        }

        // Mock successful NFC read
        return res.status(200).json({
            success: true,
            message: 'NFC tag read successfully',
            data: {
                nfcId,
                phoneId,
                timestamp: new Date(),
                readStatus: 'SUCCESS'
            }
        });
    } catch (error) {
        console.error('NFC Read Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error reading NFC tag',
            error: error.message
        });
    }
};

// Test endpoint for NFC-based authentication
exports.nfcAuthenticate = async (req, res) => {
    try {
        const { nfcId, phoneId, userId } = req.body;

        if (!nfcId || !phoneId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'NFC ID, Phone ID, and User ID are required'
            });
        }

        // Validate userId format before querying
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid userId format. Provide a valid MongoDB ObjectId.'
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // In a real implementation, you would verify the NFC ID against stored user data
        // For test purposes, we'll create a mock verification
        const mockVerification = {
            isValid: true,
            lastUsed: new Date(),
            deviceId: phoneId
        };

        if (mockVerification.isValid) {
            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user._id,
                    nfcId,
                    phoneId
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                success: true,
                message: 'NFC authentication successful',
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username
                }
            });
        }

        return res.status(401).json({
            success: false,
            message: 'NFC authentication failed'
        });
    } catch (error) {
        console.error('NFC Authentication Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during NFC authentication',
            error: error.message
        });
    }
};

exports.nfcTapIn = async (req, res) => {
  try {
    const { nfcId, busId, routeId, currentCoordinates, userId } = req.body; // userId to be authenticated via NFC

    // 1. Authenticate user via NFC (mocked for now, assumes userId is provided after successful auth)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: 'User not authenticated or invalid userId' });
    }

    // 2. Call boardBus logic from tripController
    req.body = { busId, routeId, userId, currentCoordinates }; // Re-package body for tripController
    await tripController.boardBus(req, res); // Pass req and res to boardBus

  } catch (error) {
    console.error('NFC Tap-In Error:', error);
    return res.status(500).json({ success: false, message: 'Error during NFC Tap-In', error: error.message });
  }
};

exports.nfcTapOut = async (req, res) => {
  try {
    const { nfcId, busId, routeId, currentCoordinates, userId, walletId } = req.body; // userId from NFC auth

    // 1. Authenticate user via NFC (mocked for now, assumes userId is provided after successful auth)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: 'User not authenticated or invalid userId' });
    }

    // 2. Call exitBus logic from tripController
    req.body = { busId, routeId, userId, currentCoordinates, walletId }; // Re-package body for tripController
    await tripController.exitBus(req, res); // Pass req and res to exitBus

  } catch (error) {
    console.error('NFC Tap-Out Error:', error);
    return res.status(500).json({ success: false, message: 'Error during NFC Tap-Out', error: error.message });
  }
};