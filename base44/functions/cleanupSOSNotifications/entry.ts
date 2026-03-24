import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all SOS notifications older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const old = await base44.asServiceRole.entities.RideNotification.filter({ ride_id: "sos" }, "-created_date", 200);

    const toDelete = old.filter(n => n.created_date < cutoff);

    await Promise.all(toDelete.map(n => base44.asServiceRole.entities.RideNotification.delete(n.id)));

    return Response.json({ deleted: toDelete.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});