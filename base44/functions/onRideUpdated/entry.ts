import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    if (event?.type !== 'update') return Response.json({ ok: true });

    const ride = data;
    if (!ride?.id) return Response.json({ ok: true });

    // Only notify on meaningful changes
    const relevantFields = ['status', 'start_time', 'meetup_address', 'status_message'];
    const hasRelevantChange = changed_fields?.some(f => relevantFields.includes(f));
    if (!hasRelevantChange) return Response.json({ ok: true });

    let message;
    if (ride.status === 'cancelled') {
      message = `Ride "${ride.title}" has been cancelled by @${ride.host_username}`;
    } else if (changed_fields?.includes('status') && ride.status === 'active') {
      message = `Ride "${ride.title}" has started! @${ride.host_username} is rolling.`;
    } else if (changed_fields?.includes('start_time')) {
      message = `Ride "${ride.title}" start time has been updated by @${ride.host_username}`;
    } else if (changed_fields?.includes('status_message') && ride.status_message) {
      message = `@${ride.host_username}: "${ride.status_message}" — ${ride.title}`;
    } else {
      return Response.json({ ok: true });
    }

    // Get all approved participants (excluding host)
    const participants = await base44.asServiceRole.entities.RideParticipant.filter({
      ride_id: ride.id,
      status: 'approved',
    });

    const notifications = participants
      .filter(p => p.user_email !== ride.host_email)
      .map(p => ({
        ride_id: ride.id,
        ride_title: ride.title,
        host_username: ride.host_username,
        message,
        recipient_email: p.user_email,
        read: false,
      }));

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.RideNotification.bulkCreate(notifications);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});