import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process new messages
    if (event.type !== 'create') {
      return Response.json({ status: 'skipped' });
    }

    // Fetch the ride
    const ride = await base44.asServiceRole.entities.Ride.filter({ id: data.ride_id });
    if (ride.length === 0) {
      return Response.json({ error: 'Ride not found' }, { status: 404 });
    }

    const rideData = ride[0];

    // Fetch all approved participants in this ride (exclude the message sender)
    const participants = await base44.asServiceRole.entities.RideParticipant.filter({
      ride_id: data.ride_id,
      status: 'approved',
    });

    const recipientEmails = participants
      .filter((p) => p.user_email !== data.user_email)
      .map((p) => p.user_email);

    if (recipientEmails.length === 0) {
      return Response.json({ status: 'no_recipients' });
    }

    // Create notifications for all participants
    const notifications = recipientEmails.map((email) => ({
      ride_id: rideData.id,
      ride_title: rideData.title,
      host_username: rideData.host_username,
      meetup_lat: rideData.meetup_lat,
      meetup_lng: rideData.meetup_lng,
      message: `${data.username}: ${data.text.substring(0, 60)}${data.text.length > 60 ? '...' : ''}`,
      recipient_email: email,
      read: false,
    }));

    await base44.asServiceRole.entities.RideNotification.bulkCreate(notifications);

    return Response.json({ status: 'success', count: notifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});