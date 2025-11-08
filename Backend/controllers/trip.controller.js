const Transport = require('../models/transport.model');
const Trip = require('../models/trip.model');
const Wallet = require('../models/wallet.model');
const jwt = require('jsonwebtoken');
const { deductMoney } = require('./wallet.controller');
const { createTransaction2 } = require('./transactions.controller');

exports.handleTripStatus = async (req, res) => {
  try {
    const { transportId, token } = req.body;
    const fare = 50;

    // ✅ Verify & decode JWT to extract user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // ✅ Ensure wallet exists
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        message: 'Wallet not found. Please ask user for KYC verification.'
      });
    }

    // ✅ Validate transport
    const bus = await Transport.findById(transportId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // ✅ Check if there's an ACTIVE trip (Tap-Out)
    let activeTrip = await Trip.findOne({
      transportId,
      passengerId: userId,
      isCompleted: false
    });

    if (activeTrip) {
      // ✅ TAP-OUT — complete existing trip
      const updatedTrip = await Trip.findOneAndUpdate(
        { _id: activeTrip._id },
        {
          $set: {
            isCompleted: true,
            destinationStation: "Budanilkantha",
            fare
          }
        },
        { new: true }
      );

      const walletId = wallet._id;

      await deductMoney({ amount:fare, walletId });

      await createTransaction2({
        type: "Bus Fare",
        amount: fare,
        walletId,
        remarks: `From ${updatedTrip.startingStation} to ${updatedTrip.destinationStation}`
      });

      return res.status(200).json({
        message: "Trip completed successfully!",
        trip: updatedTrip
      });
    }

    // ✅ TAP-IN — create new active trip
    const newTrip = new Trip({
      transportId,
      startingStation: "Maitidevi",
      fare: 0,
      destinationStation: "TBD",
      passengerType: "User",
      passengerId: userId,
      isCompleted: false
    });

    await newTrip.save();

    return res.status(200).json({
      message: "User boarded successfully!",
      trip: newTrip,
      bus
    });

  } catch (error) {
    console.error("Trip Status Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


exports.getTrips = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch all trips for this user
    const trips = await Trip.find({ passengerId: userId })
      .populate({ path: 'transportId', model: Transport })
      .sort({ createdAt: -1 });

    // Format trips
    const formattedTrips = trips.map(trip => ({
      from: trip.startingStation || 'TBD',
      to: trip.destinationStation || 'TBD',
      date: trip.createdAt ? trip.createdAt.toISOString().split('T')[0] : 'TBD',
      bus: trip.transportId
        ? `${trip.transportId.transportCompany} ${trip.transportId.vehicleNumber}`
        : 'Unknown Bus',
      status: trip.isCompleted ? 'Completed' : 'Active',
      fare: `NPR ${trip.fare.toFixed(2)}`,
      startTime: trip.createdAt
        ? trip.createdAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'TBD',
      endTime:
        trip.updatedAt && trip.isCompleted
          ? trip.updatedAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : 'TBD'
    }));

    return res.status(200).json({ trips: formattedTrips });
  } catch (error) {
    console.error('Get Trips Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
