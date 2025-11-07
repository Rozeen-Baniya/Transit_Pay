const BusTrip = require('../models/bustrip.model');
const Route = require('../models/route.model');
const Stop = require('../models/stop.model');
const Transport = require('../models/transport.model');
const geoService = require('../services/geo.service');
const walletController = require('./wallet.controller');
const fareService = require('../services/fare.service');



// change needed asap 
// 1) single function to handle both board and exit
// 2) proper error handling and status codes
// fare and departure and arrivals to be hardcoded for MVP





// User boards a bus
exports.boardBus = async (req, res) => {
  try {
    const { busId, routeId, userId, currentCoordinates } = req.body;

    // 1. Validate bus and route
    const bus = await Transport.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    const route = await Route.findById(routeId).populate('stops.stop');
    if (!route) return res.status(404).json({ message: 'Route not found' });

    // 2. Geolocation Matching: Check if bus is on the correct route
    if (!geoService.isOnRoute(route, currentCoordinates)) {
      return res.status(400).json({ message: 'Bus is not on the assigned route' });
    }

    // 3. Geolocation Matching: Find nearest stop on the route
    const nearestStop = await geoService.nearestStopOnRoute(route, currentCoordinates);
    if (!nearestStop || nearestStop.distanceMeters > 50) { // Within 50 meters of a stop
      return res.status(400).json({ message: 'Bus is not at a valid stop on this route' });
    }

    const boardStop = nearestStop.stop;

    // 4. Create or update BusTrip (simplified: find active trip or create new)
    let busTrip = await BusTrip.findOne({ busId, routeId, status: 'in_progress' });

    if (!busTrip) {
      busTrip = new BusTrip({
        busId,
        routeId,
        currentLocation: { coordinates: currentCoordinates },
        status: 'in_progress',
        passengers: []
      });
    }

    // 5. Record passenger boarding
    // Check if passenger is already on board
    const existingPassenger = busTrip.passengers.find(p => p.userId.toString() === userId);
    if (existingPassenger && !existingPassenger.exitTime) {
      return res.status(400).json({ message: 'User already boarded on an active trip' });
    }

    busTrip.passengers.push({
      userId,
      boardStopId: boardStop._id,
      boardTime: new Date()
    });

    await busTrip.save();

    res.status(200).json({
      message: 'User boarded successfully',
      busTripId: busTrip._id,
      boardStop: boardStop.name,
      currentLocation: busTrip.currentLocation
    });

  } catch (error) {
    console.error('Board bus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User exits a bus
exports.exitBus = async (req, res) => {
  try {
    const { busId, routeId, userId, currentCoordinates } = req.body;

    // 1. Find the active bus trip
    const busTrip = await BusTrip.findOne({ busId, routeId, status: 'in_progress' });
    if (!busTrip) {
      return res.status(404).json({ message: 'No active trip found for this bus and route' });
    }

    // 2. Find the passenger on this trip who is yet to exit
    const passengerIndex = busTrip.passengers.findIndex(
      p => p.userId.toString() === userId && !p.exitTime
    );
    if (passengerIndex === -1) {
      return res.status(404).json({ message: 'User not found on this bus trip or already exited' });
    }

    const passenger = busTrip.passengers[passengerIndex];

    // 3. Validate route and find exit stop
    const route = await Route.findById(routeId).populate('stops.stop');
    if (!route) return res.status(404).json({ message: 'Route not found' });

    if (!geoService.isOnRoute(route, currentCoordinates)) {
      return res.status(400).json({ message: 'Bus is not on the assigned route for exit validation' });
    }

    const nearestExitStop = await geoService.nearestStopOnRoute(route, currentCoordinates);
    if (!nearestExitStop || nearestExitStop.distanceMeters > 50) {
      return res.status(400).json({ message: 'Bus is not at a valid stop for exit' });
    }

    const exitStop = nearestExitStop.stop;

    // 4. Update passenger exit details
    passenger.exitStopId = exitStop._id;
    passenger.exitTime = new Date();

    // 5. Calculate fare
    const boardStop = await Stop.findById(passenger.boardStopId);
    if (!boardStop) return res.status(500).json({ message: 'Board stop not found for fare calculation' });

    const fare = await fareService.calculateFare(boardStop, exitStop, route);
    passenger.provisionalFare = fare;

    // 6. Deduct fare using wallet controller
    // This is a simplified call assuming the walletController.deductFare can be directly called or a service wrapper exists
    // In a real application, you might use an internal service or a more robust queuing system
    const mockReq = { 
      userId: userId,
      params: { walletId: req.body.walletId }, // Assuming walletId is passed in body for simplicity
      body: { 
        amount: fare, 
        currency: 'NPR', // Example currency
        idempotencyKey: `${busTrip._id}-${userId}-${Date.now()}`,
        fareDetails: { 
          boardStop: boardStop.name, 
          exitStop: exitStop.name, 
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
    // await walletController.deductFare(mockReq, mockRes); // Call the deductFare function

    await busTrip.save();

    res.status(200).json({
      message: 'User exited successfully',
      busTripId: busTrip._id,
      exitStop: exitStop.name,
      fare: fare,
      currentLocation: busTrip.currentLocation
    });

  } catch (error) {
    console.error('Exit bus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
