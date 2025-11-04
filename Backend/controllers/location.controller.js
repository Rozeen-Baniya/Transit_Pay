const Transport = require('../models/transport.model');

// Get the current location and state of a specific transport
exports.getTransportLocation = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.transportId)
      .select('vehicleNumber location connectionState');
    
    if (!transport) {
      return res.status(404).json({ message: 'Transport not found' });
    }

    res.json(transport);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transport location', error: err.message });
  }
};

// Get all active transports with their locations
exports.getActiveTransports = async (req, res) => {
  try {
    const transports = await Transport.find({
      'connectionState.isOnline': true,
      'location.coordinates.0': { $ne: 0 },
      'location.coordinates.1': { $ne: 0 }
    }).select('vehicleNumber location connectionState route');

    res.json(transports);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching active transports', error: err.message });
  }
};

// Get transports within a specific radius of a point
exports.getNearbyTransports = async (req, res) => {
  try {
    const { longitude, latitude, radiusInKm = 5 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required' });
    }

    const transports = await Transport.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radiusInKm * 1000 // Convert km to meters
        }
      }
    }).select('vehicleNumber location connectionState route');

    res.json(transports);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching nearby transports', error: err.message });
  }
};