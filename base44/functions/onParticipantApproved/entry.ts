import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process updates where status changed to "approved"
    if (event.type !== 'update' || data.status !== 'approved') {
      return Response.json({ status: 'skipped' });
    }

    // Fetch the ride to get details
    const ride = await base44.asServiceRole.entities.Ride.filter({ id: data.ride_id });
    if (ride.length === 0) {
      return Response.json({ error: 'Ride not found' }, { status: 404 });
    }

    const rideData = ride[0];

    // Create notification for the approved rider
    await base44.asServiceRole.entities.RideNotification.create({
      ride_id: rideData.id,
      ride_title: rideData.title,
      host_username: rideData.host_username,
      meetup_lat: rideData.meetup_lat,
      meetup_lng: rideData.meetup_lng,
      message: `Your request to join "${rideData.title}" was approved! 🎉`,
      recipient_email: data.user_email,
      read: false,
    });

    return Response.json({ status: 'success' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});