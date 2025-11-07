const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    stops: [
      {
        stop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: true },
        order: { type: Number, required: true }
      }
    ],
    // Full expected path of the route (geojson LineString of [lon,lat] coords)
    path: {
      type: { type: String, enum: ['LineString'], default: 'LineString' },
      coordinates: { type: [[Number]], default: [] }
    },
    serviceHours: {
      start: { type: String, default: '06:00' },
      end: { type: String, default: '22:00' }
    },
    active: { type: Boolean, default: true },
    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

routeSchema.index({ path: '2dsphere' });

module.exports = mongoose.model('Route', routeSchema);
