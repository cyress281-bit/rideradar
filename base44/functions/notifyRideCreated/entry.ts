import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ success: true });
    }

    const ride = data;

    // Don't notify for "Ride Now" - those use broadcast
    if (ride.ride_type === 'casual') {
      return Response.json({ success: true });
    }

    // For planned events, notify users within ~15 miles (24km)
    const NEARBY_RADIUS_KM = 24;
    const allUsers = await base44.asServiceRole.entities.User.list(null, 1000);

    const nearbyUsers = allUsers.filter(u => {
      if (!u.last_location_lat || !u.last_location_lng) return false;
      const dist = getDistance(ride.meetup_lat, ride.meetup_lng, u.last_location_lat, u.last_location_lng);
      return dist <= NEARBY_RADIUS_KM && u.email !== ride.host_email && !u.invisible_mode;
    });

    // Create notifications for nearby users
    for (const user of nearbyUsers) {
      await base44.asServiceRole.entities.RideNotification.create({
        ride_id: ride.id,
        ride_title: ride.title,
        host_username: ride.host_username,
        meetup_lat: ride.meetup_lat,
        meetup_lng: ride.meetup_lng,
        message: `New ${ride.event_format === 'stationary' ? 'gathering' : 'route'} near you: ${ride.title}`,
        recipient_email: user.email,
        read: false,
      });
    }

    return Response.json({ success: true, notified: nearbyUsers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}