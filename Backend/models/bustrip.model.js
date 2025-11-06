const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    boardStopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: true },
    boardTime: { type: Date, default: Date.now },
    exitStopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
    exitTime: { type: Date },
    provisionalFare: { type: Number },
    chargedTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  },
  { _id: false }
);

const busTripSchema = new mongoose.Schema(
  {
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transport', required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    pathTraveled: {
      type: { type: String, enum: ['LineString'], default: 'LineString' },
      coordinates: { type: [[Number]], default: [] }
    },
    passengers: [passengerSchema],
    totalDistanceMeters: { type: Number, default: 0 },
    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

busTripSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('BusTrip', busTripSchema);
