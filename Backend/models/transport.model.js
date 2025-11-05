const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverLicenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    route: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    driverPermitProof: {
      type: String,
      required: true,
      trim: true,
    },
    transportCompany: {
      type: String,
      required: true,
      trim: true,
    },
    loginCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    }
  },
  { timestamps: true }
);

// Create a 2dsphere index for geospatial queries
transportSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Transport', transportSchema);

module.exports = mongoose.model("Transport", transportSchema);
