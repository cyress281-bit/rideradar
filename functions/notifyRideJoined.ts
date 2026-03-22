import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ success: true });
    }

    const participant = data;

    // Only notify for riders, not hosts
    if (participant.role === 'host') {
      return Response.json({ success: true });
    }

    // Get the ride details
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: participant.ride_id });
    if (rides.length === 0) {
      return Response.json({ success: true });
    }

    const ride = rides[0];

    // Notify the ride host that someone joined
    await base44.asServiceRole.entities.RideNotification.create({
      ride_id: ride.id,
      ride_title: ride.title,
      host_username: ride.host_username,
      meetup_lat: ride.meetup_lat,
      meetup_lng: ride.meetup_lng,
      message: `@${participant.username} joined your ride`,
      recipient_email: ride.host_email,
      read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});