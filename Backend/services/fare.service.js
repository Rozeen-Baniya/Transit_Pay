const haversineDistanceMeters = require('./geo.service').haversineDistanceMeters;

async function calculateFare(boardStop, exitStop, route, provisional = false) {
  if (!boardStop || !exitStop || !route) {
    throw new Error('Missing required parameters for fare calculation');
  }

  // Basic flat fare for demonstration
  let fare = 50; // Default fare

  // Implement more complex pricing logic here based on stop pricingRules, distance, zones, etc.
  // Example: distance-based pricing
  const boardCoords = boardStop.coordinates.coordinates;
  const exitCoords = exitStop.coordinates.coordinates;
  const distance = haversineDistanceMeters(boardCoords, exitCoords);

  // Example: if distance-based pricing is defined per stop
  if (boardStop.pricingRules && boardStop.pricingRules.perKm) {
    fare = (distance / 1000) * boardStop.pricingRules.perKm; // Fare per KM
  }

  // Apply base fare override if present
  if (boardStop.pricingRules && boardStop.pricingRules.baseFareOverride) {
    fare = Math.max(fare, boardStop.pricingRules.baseFareOverride); // Take higher of calculated or override
  }

  // Apply multipliers (peak/off-peak) - simplified example
  const now = new Date();
  const hour = now.getHours();
  const isPeakHour = hour >= 6 && hour <= 9 || hour >= 16 && hour <= 19; // Example peak hours

  if (boardStop.pricingRules && boardStop.pricingRules.multipliers) {
    if (isPeakHour && boardStop.pricingRules.multipliers.peak) {
      fare *= boardStop.pricingRules.multipliers.peak;
    } else if (!isPeakHour && boardStop.pricingRules.multipliers.offPeak) {
      fare *= boardStop.pricingRules.multipliers.offPeak;
    }
  }

  // Round to two decimal places for currency
  return parseFloat(fare.toFixed(2));
}

module.exports = {
  calculateFare
};
