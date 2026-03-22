import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data, changed_fields } = payload;
    if (event?.type !== 'update') return Response.json({ skipped: true });

    // Only fire when status_message specifically changed
    if (!changed_fields?.includes('status_message')) return Response.json({ skipped: 'status_message not changed' });
    if (!data?.status_message) return Response.json({ skipped: 'no message' });
    if (data.status_message === old_data?.status_message) return Response.json({ skipped: 'same message' });

    // Only notify during active rides
    if (data.status !== 'active') return Response.json({ skipped: 'ride not active' });

    const rideId = data.id || event?.entity_id;
    if (!rideId) return Response.json({ skipped: 'no ride id' });

    // Get all approved riders (not the host)
    const participants = await base44.asServiceRole.entities.RideParticipant.filter({
      ride_id: rideId,
      status: 'approved',
    });

    const riders = participants.filter(p => p.role !== 'host');
    if (riders.length === 0) return Response.json({ skipped: 'no riders' });

    const emailPromises = riders.map(rider =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: rider.user_email,
        subject: `📢 Update from @${data.host_username} — ${data.title}`,
        body: `
Hey @${rider.username},

Your host has sent a new update during the ride:

💬 "<strong>${data.status_message}</strong>"

— @${data.host_username}

Open the app to stay connected with your group.

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