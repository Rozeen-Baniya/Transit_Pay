const haversineDistanceMeters = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Project point p onto segment ab (all [lon,lat]) and return the closest point and t
function projectPointOnSegment(p, a, b) {
  // Convert degrees to radians for small-euclidean approximation in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // meters

  // convert lon/lat to ECEF-like flat coordinates using equirectangular projection around point a
  const latRef = toRad(a[1]);
  const x = (lon, lat) => [R * (toRad(lon) - toRad(a[0])) * Math.cos(latRef), R * (toRad(lat) - toRad(a[1]))];

  const pxy = x(p[0], p[1]);
  const axy = [0, 0];
  const bxy = x(b[0], b[1]);

  const vx = bxy[0] - axy[0];
  const vy = bxy[1] - axy[1];
  const wx = pxy[0] - axy[0];
  const wy = pxy[1] - axy[1];
  const vlen2 = vx * vx + vy * vy;
  let t = 0;
  if (vlen2 > 0) {
    t = (wx * vx + wy * vy) / vlen2;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
  }
  const projX = axy[0] + t * vx;
  const projY = axy[1] + t * vy;

  // convert back to lon/lat
  const inv = (px, py) => {
    const lat = a[1] + (py / R) * (180 / Math.PI);
    const lon = a[0] + (px / (R * Math.cos(latRef))) * (180 / Math.PI);
    return [lon, lat];
  };

  return { point: inv(projX, projY), t };
}

function distancePointToSegmentMeters(p, a, b) {
  const proj = projectPointOnSegment(p, a, b);
  return haversineDistanceMeters(p, proj.point);
}

// Find nearest point on a LineString path to coords and return {point, distanceMeters, index (segment index), t}
function snapToRoute(pathCoordinates = [], coords) {
  if (!Array.isArray(pathCoordinates) || pathCoordinates.length === 0) {
    return null;
  }
  let best = { distance: Infinity, point: null, index: -1, t: 0 };
  for (let i = 0; i < pathCoordinates.length - 1; i++) {
    const a = pathCoordinates[i];
    const b = pathCoordinates[i + 1];
    const proj = projectPointOnSegment(coords, a, b);
    const d = haversineDistanceMeters(coords, proj.point);
    if (d < best.distance) {
      best = { distance: d, point: proj.point, index: i, t: proj.t };
    }
  }
  // Also check endpoints if path has single point
  if (pathCoordinates.length === 1) {
    const d = haversineDistanceMeters(coords, pathCoordinates[0]);
    best = { distance: d, point: pathCoordinates[0], index: 0, t: 0 };
  }
  return { point: best.point, distanceMeters: best.distance, segmentIndex: best.index, t: best.t };
}

// Check if a given coords is on/near the route path within toleranceMeters
function isOnRoute(route, coords, toleranceMeters = 50) {
  if (!route || !route.path || !Array.isArray(route.path.coordinates)) return false;
  const snap = snapToRoute(route.path.coordinates, coords);
  if (!snap) return false;
  return snap.distanceMeters <= toleranceMeters;
}

// Given a route and coords, find the nearest stop on that route within maxDistanceMeters
// route.stops is expected to be an array of { stop: populatedStopOrId, order }
// If stops are not populated, caller should populate or pass an array of stop-like objects
async function nearestStopOnRoute(route, coords, maxDistanceMeters = 100) {
  if (!route) return null;
  const stopsArray = route.stops || [];
  let best = { stop: null, distance: Infinity };

  for (const s of stopsArray) {
    const stop = s.stop || s; // support both shapes
    if (!stop) continue;
    // attempt to read coordinates
    const sc =
      stop.coordinates && Array.isArray(stop.coordinates.coordinates)
        ? stop.coordinates.coordinates
        : stop.location && Array.isArray(stop.location.coordinates)
        ? stop.location.coordinates
        : null;
    if (!sc) continue;
    const d = haversineDistanceMeters(coords, sc);
    if (d < best.distance) {
      best = { stop, distance: d };
    }
  }
  if (best.distance <= maxDistanceMeters) return { stop: best.stop, distanceMeters: best.distance };
  return null;
}

module.exports = {
  haversineDistanceMeters,
  snapToRoute,
  isOnRoute,
  nearestStopOnRoute,
  distancePointToSegmentMeters
};
