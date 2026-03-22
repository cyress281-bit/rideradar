import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Only trigger on update events where status changed to "approved"
    const { event, data, old_data } = payload;
    if (event?.type !== 'update') return Response.json({ skipped: true });
    if (data?.status !== 'approved') return Response.json({ skipped: 'not approved' });
    if (old_data?.status === 'approved') return Response.json({ skipped: 'already approved' });

    const participantEmail = data.user_email;
    const participantUsername = data.username;
    const rideId = data.ride_id;

    if (!participantEmail || !rideId) {
      return Response.json({ skipped: 'missing data' });
    }

    // Fetch the ride details
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    const ride = rides[0];
    if (!ride) return Response.json({ skipped: 'ride not found' });

    const startTime = new Date(ride.start_time).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: participantEmail,
      subject: `✅ You're in! Join request approved — ${ride.title}`,
      body: `
Hey @${participantUsername},

Your request to join <strong>${ride.title}</strong> has been approved by the host!

<strong>Ride Details:</strong>
• Start: ${startTime}
• Duration: ${ride.duration_minutes} minutes
• Meetup: ${ride.meetup_address || 'See map in app'}
• Host: @${ride.host_username}

${ride.requirements ? `<strong>Requirements:</strong> ${ride.requirements}\n\n` : ''}
Open the app to see the meetup location and get ready to ride. 🏍️

Stay safe out there,
RideRadar
      `.trim(),
    });

    return Response.json({ success: true, notified: participantEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});