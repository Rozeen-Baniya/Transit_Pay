const BusTrip = require('../models/bustrip.model');
const Route = require('../models/route.model');
const Transport = require('../models/transport.model');
const geoService = require('../services/geo.service');
const walletController = require('./wallet.controller');
const fareService = require('../services/fare.service');
// const Stop = require('../models/stop.model'); // No longer needed as fare is hardcoded

exports.handleTripStatus = async (req, res) => {
  try {
    const { busId, routeId, userId, currentCoordinates, walletId } = req.body;

    // 1. Validate bus and route
    const bus = await Transport.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    const route = await Route.findById(routeId).populate('stops.stop');
    if (!route) return res.status(404).json({ message: 'Route not found' });

    // 2. Geolocation Matching: Check if bus is on the correct route
    if (!geoService.isOnRoute(route, currentCoordinates)) {
      return res.status(400).json({ message: 'Bus is not on the assigned route' });
    }

    // 3. Find nearest stop on the route
    const nearestStop = await geoService.nearestStopOnRoute(route, currentCoordinates);
    if (!nearestStop || nearestStop.distanceMeters > 50) { // Within 50 meters of a stop
      return res.status(400).json({ message: 'Bus is not at a valid stop on this route' });
    }
    const currentStop = nearestStop.stop;

    // 4. Check for an active trip for the user on this bus/route
    let busTrip = await BusTrip.findOne({
      busId,
      routeId,
      'passengers.userId': userId,
      'passengers.exitTime': { $exists: false } // Passenger has not exited yet
    });

    if (busTrip) {
      // User has an active trip (Tap-Out scenario)
      const passengerIndex = busTrip.passengers.findIndex(
        p => p.userId.toString() === userId && !p.exitTime
      );
      const passenger = busTrip.passengers[passengerIndex];

      // Update passenger exit details
      passenger.exitStopId = currentStop._id;
      passenger.exitTime = new Date();

      // Calculate fare (hardcoded)
      const fare = 50; // Hardcoded fare as per new requirement
      passenger.provisionalFare = fare;

      // Deduct fare using wallet controller (uncomment for actual deduction)
      const mockReq = {
        userId: userId,
        params: { walletId: walletId },
        body: {
          amount: fare,
          currency: 'NPR',
          idempotencyKey: `${busTrip._id}-${userId}-${Date.now()}`,
          fareDetails: {
            boardStop: boardStop.name,
            exitStop: currentStop.name,
            route: route.name,
            calculatedFare: fare
          },
          location: { coordinates: currentCoordinates }
        }
      };
      const mockRes = {
        status: (statusCode) => ({
          json: (data) => {
            if (statusCode !== 200) console.error('Fare deduction failed:', data);
          }
        })
      };
      // await walletController.deductFare(mockReq, mockRes);

      await busTrip.save();

      res.status(200).json({
        message: 'User exited successfully',
        busTripId: busTrip._id,
        exitStop: currentStop.name,
        fare: fare,
        currentLocation: busTrip.currentLocation
      });

    } else {
      // User does not have an active trip (Tap-In scenario)
      let activeBusTrip = await BusTrip.findOne({ busId, routeId, status: 'in_progress' });

      if (!activeBusTrip) {
        activeBusTrip = new BusTrip({
          busId,
          routeId,
          currentLocation: { coordinates: currentCoordinates },
          status: 'in_progress',
          passengers: []
        });
      }

      // Record passenger boarding
      activeBusTrip.passengers.push({
        userId,
        boardStopId: currentStop._id,
        boardTime: new Date()
      });

      await activeBusTrip.save();

      res.status(200).json({
        message: 'User boarded successfully',
        busTripId: activeBusTrip._id,
        boardStop: currentStop.name,
        currentLocation: activeBusTrip.currentLocation
      });
    }

  } catch (error) {
    console.error('Handle trip status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
