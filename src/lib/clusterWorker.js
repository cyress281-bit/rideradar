// Web Worker: geographic grid-based marker clustering
// Runs off the main thread — no DOM or Leaflet access needed.

self.onmessage = function ({ data: { markers, zoom } }) {
  // Approximate degrees per 80-pixel grid cell at this zoom level
  const gridDeg = (80 * 360) / (256 * Math.pow(2, zoom));

  const buckets = {};

  markers.forEach((marker) => {
    const [lat, lng] = marker.position;
    const key = `${Math.floor(lat / gridDeg)},${Math.floor(lng / gridDeg)}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(marker);
  });

  const clusters = [];

  Object.values(buckets).forEach((items) => {
    if (items.length < 2) return; // singletons rendered normally

    const lat = items.reduce((s, m) => s + m.position[0], 0) / items.length;
    const lng = items.reduce((s, m) => s + m.position[1], 0) / items.length;
    const positions = items.map((m) => m.position);

    clusters.push({ center: [lat, lng], count: items.length, positions });
  });

  self.postMessage(clusters);
};