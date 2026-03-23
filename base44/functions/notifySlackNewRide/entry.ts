import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ride = payload.data;

    if (!ride) {
      return Response.json({ error: 'No ride data' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slack');

    // Find the "local" channel
    const channelsRes = await fetch('https://slack.com/api/conversations.list?limit=200&exclude_archived=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const channelsData = await channelsRes.json();
    const channel = channelsData.channels?.find((c) => c.name === 'local');

    if (!channel) {
      return Response.json({ error: 'Channel "local" not found' }, { status: 404 });
    }

    const startTime = ride.start_time
      ? new Date(ride.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Now';

    const text = [
      `🏍️ *New Ride Alert!*`,
      `*${ride.title}* hosted by @${ride.host_username}`,
      `📍 ${ride.meetup_address || 'See app for location'}`,
      `🕐 ${startTime}`,
      ride.vibe ? `✨ Vibe: ${ride.vibe}` : null,
      ride.bike_class && ride.bike_class !== 'any' ? `🔧 Bike: ${ride.bike_class}` : null,
      ride.requirements ? `📋 ${ride.requirements}` : null,
    ].filter(Boolean).join('\n');

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel: channel.id, text, mrkdwn: true }),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});