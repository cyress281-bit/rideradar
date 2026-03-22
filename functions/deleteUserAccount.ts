import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Delete associated data in order of dependencies
    await base44.asServiceRole.entities.DirectMessage.bulkDelete(
      { $or: [{ sender_email: userEmail }, { recipient_email: userEmail }] }
    );

    await base44.asServiceRole.entities.RideMessage.bulkDelete(
      { user_email: userEmail }
    );

    await base44.asServiceRole.entities.RideTrackPoint.bulkDelete(
      { user_email: userEmail }
    );

    await base44.asServiceRole.entities.RiderLocation.bulkDelete(
      { user_email: userEmail }
    );

    const userRides = await base44.asServiceRole.entities.Ride.filter(
      { host_email: userEmail }
    );
    for (const ride of userRides) {
      await base44.asServiceRole.entities.RideParticipant.bulkDelete(
        { ride_id: ride.id }
      );
      await base44.asServiceRole.entities.Ride.delete(ride.id);
    }

    await base44.asServiceRole.entities.RideParticipant.bulkDelete(
      { user_email: userEmail }
    );

    await base44.asServiceRole.entities.RideNotification.bulkDelete(
      { $or: [{ recipient_email: userEmail }, { recipient_email: "" }] }
    );

    await base44.asServiceRole.entities.UserBlock.bulkDelete(
      { $or: [{ blocker_email: userEmail }, { blocked_email: userEmail }] }
    );

    return Response.json({ 
      success: true, 
      message: 'Account and all associated data deleted successfully' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});