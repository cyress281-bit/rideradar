export function describeRideDistance(userPosition, lat, lng) {
  if (!userPosition) return "";

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat - userPosition.lat);
  const dLng = toRadians(lng - userPosition.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userPosition.lat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const distance = earthRadiusMiles * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

  if (distance < 0.2) return "Very close to your location";
  if (distance < 1) return `About ${distance.toFixed(1)} miles away`;
  return `About ${Math.round(distance * 10) / 10} miles away`;
}