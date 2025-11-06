const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lon, lat]
    },
    pricingRules: {
      // Optional per-stop overrides
      zoneId: { type: String },
      baseFareOverride: { type: Number },
      perKm: { type: Number },
      multipliers: {
        peak: { type: Number },
        offPeak: { type: Number }
      }
    },
    nearbyRadiusMeters: { type: Number, default: 50 },
    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

stopSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Stop', stopSchema);
