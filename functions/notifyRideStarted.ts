import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;
    if (event?.type !== 'update') return Response.json({ skipped: true });
    if (data?.status !== 'active') return Response.json({ skipped: 'not started' });
    if (old_data?.status === 'active') return Response.json({ skipped: 'already active' });

    const rideId = data.id || event?.entity_id;
    if (!rideId) return Response.json({ skipped: 'no ride id' });

    // Get all approved participants (excluding host - they triggered it)
    const participants = await base44.asServiceRole.entities.RideParticipant.filter({
      ride_id: rideId,
      status: 'approved',
    });

    const riders = participants.filter(p => p.role !== 'host');
    if (riders.length === 0) return Response.json({ skipped: 'no riders to notify' });

    const startTime = new Date(data.start_time).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });

    const emailPromises = riders.map(rider =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: rider.user_email,
        subject: `🏍️ Ride is rolling! ${data.title}`,
        body: `
Hey @${rider.username},

<strong>${data.host_username}</strong> just kicked off the ride — it's time to roll!

<strong>${data.title}</strong>
• Started: ${startTime}
• Duration: ${data.duration_minutes} minutes
• Meetup: ${data.meetup_address || 'See map in app'}

${data.status_message ? `<strong>Host says:</strong> "${data.status_message}"\n\n` : ''}
Open the app to connect with your group. Ride safe! 🤙

RideRadar
        `.trim(),
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ success: true, notified: riders.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});