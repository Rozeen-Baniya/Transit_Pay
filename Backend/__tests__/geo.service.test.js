const geo = require('../services/geo.service');

describe('geo.service', () => {
  test('haversineDistanceMeters between same point is 0', () => {
    const d = geo.haversineDistanceMeters([85.0, 27.0], [85.0, 27.0]);
    expect(d).toBeCloseTo(0, 5);
  });

  test('haversineDistanceMeters gives ~111km per degree lat', () => {
    // 1 degree latitude ~ 111.19 km
    const d = geo.haversineDistanceMeters([85.0, 27.0], [85.0, 28.0]);
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112500);
  });

  test('snapToRoute returns small distance for point near segment', () => {
    const path = [ [85.0,27.0], [86.0,27.0] ];
    const point = [85.0005, 27.0005];
    const snap = geo.snapToRoute(path, point);
    expect(snap).toBeTruthy();
    expect(snap.distanceMeters).toBeLessThan(100); // close
  });

  test('isOnRoute true when within tolerance', () => {
    const route = { path: { coordinates: [ [85.0,27.0], [86.0,27.0] ] } };
    const point = [85.0005, 27.0005];
    const on = geo.isOnRoute(route, point, 200);
    expect(on).toBe(true);
  });

  test('nearestStopOnRoute finds the closest stop within maxDistance', async () => {
    const route = {
      stops: [
        { stop: { code: 'A', coordinates: { coordinates: [85.0, 27.0] } }, order: 1 },
        { stop: { code: 'B', coordinates: { coordinates: [86.0, 27.0] } }, order: 2 }
      ]
    };
    const point = [85.0001, 27.0001];
    const found = await geo.nearestStopOnRoute(route, point, 500);
    expect(found).toBeTruthy();
    expect(found.stop.code).toBe('A');
    expect(found.distanceMeters).toBeLessThan(100);
  });
});
