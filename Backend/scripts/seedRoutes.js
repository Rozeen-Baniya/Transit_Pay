/* Seed script for stops and routes
   Usage: node scripts/seedRoutes.js
   Make sure your Backend/.env is configured and MongoDB reachable.
*/

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../services/mongoose.service');
const Stop = require('../models/stop.model');
const Route = require('../models/route.model');

async function seed() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const stopsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sample-stops.json')));
    const routesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sample-routes.json')));

    // Insert or update stops
    const codeToId = {};
    for (const s of stopsData) {
      const existing = await Stop.findOne({ code: s.code });
      let doc;
      if (existing) {
        existing.name = s.name;
        existing.coordinates = { type: 'Point', coordinates: s.coordinates };
        existing.pricingRules = s.pricingRules || {};
        doc = await existing.save();
        console.log('Updated stop', s.code);
      } else {
        doc = await Stop.create({
          code: s.code,
          name: s.name,
          coordinates: { type: 'Point', coordinates: s.coordinates },
          pricingRules: s.pricingRules || {}
        });
        console.log('Created stop', s.code);
      }
      codeToId[s.code] = doc._id;
    }

    // Insert or update routes
    for (const r of routesData) {
      const existing = await Route.findOne({ code: r.code });
      const stops = (r.stops || []).map((code, idx) => ({ stop: codeToId[code], order: idx + 1 }));
      const pathGeo = { type: 'LineString', coordinates: r.path.coordinates };

      if (existing) {
        existing.name = r.name;
        existing.description = r.description;
        existing.stops = stops;
        existing.path = pathGeo;
        await existing.save();
        console.log('Updated route', r.code);
      } else {
        await Route.create({
          code: r.code,
          name: r.name,
          description: r.description,
          stops,
          path: pathGeo
        });
        console.log('Created route', r.code);
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
