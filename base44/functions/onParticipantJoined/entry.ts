import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'create') return Response.json({ ok: true });

    const participant = data;
    if (!participant?.ride_id || !participant?.username) return Response.json({ ok: true });

    // Fetch the ride to get host info
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: participant.ride_id });
    const ride = rides[0];
    if (!ride || !ride.host_email) return Response.json({ ok: true });

    // Don't notify if the host is joining their own ride
    if (participant.user_email === ride.host_email) return Response.json({ ok: true });

    await base44.asServiceRole.entities.RideNotification.create({
      ride_id: ride.id,
      ride_title: ride.title,
      host_username: ride.host_username,
      message: `@${participant.username} just joined your ride "${ride.title}"`,
      recipient_email: ride.host_email,
      read: false,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});