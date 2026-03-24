import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X, ShieldOff } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function SOSButton({ user }) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const queryClient = useQueryClient();

  const selfUsername = user?.username || user?.email?.split("@")[0];

  // Check if user has an active SOS notification in DB
  const { data: activeSOS = [] } = useQuery({
    queryKey: ["my-sos", user?.email],
    queryFn: () => base44.entities.RideNotification.filter({ ride_id: "sos", host_username: selfUsername }, "-created_date", 1),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  const activeSOSNotif = activeSOS[0] || null;
  const sent = !!activeSOSNotif;

  const handlePress = () => {
    if (sent) {
      setConfirmCancel(true);
      return;
    }
    setConfirming(true);
  };

  const handleCancelSOS = async () => {
    setCancelling(true);
    setConfirmCancel(false);
    // Delete the SOS notification
    if (activeSOSNotif) {
      await base44.entities.RideNotification.delete(activeSOSNotif.id);
    }
    // Remove from all active ride participants
    const participations = await base44.entities.RideParticipant.filter({ user_email: user.email, status: "approved" });
    await Promise.all(participations.map(p => base44.entities.RideParticipant.update(p.id, { status: "left" })));
    // Remove rider locations
    const locations = await base44.entities.RiderLocation.filter({ user_email: user.email, is_active: true });
    await Promise.all(locations.map(l => base44.entities.RiderLocation.update(l.id, { is_active: false })));
    queryClient.invalidateQueries({ queryKey: ["my-sos", user?.email] });
    queryClient.invalidateQueries({ queryKey: ["sos-notifications"] });
    setCancelling(false);
  };

  const handleConfirm = async () => {
    setSending(true);
    setConfirming(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const username = user?.username || user?.email?.split("@")[0] || "A rider";

        await base44.entities.RideNotification.create({
          ride_id: "sos",
          ride_title: "🚨 BIKER DOWN",
          host_username: username,
          meetup_lat: lat,
          meetup_lng: lng,
          message: `🚨 B-DOWN: ${username} may be in an accident and needs immediate assistance.`,
          recipient_email: "",
          read: false,
        });

        setSending(false);
        setSent(true);
        // Reset after 30s
        setTimeout(() => setSent(false), 30000);
      },
      () => {
        // No GPS — still send without coords
        const username = user?.username || user?.email?.split("@")[0] || "A rider";
        base44.entities.RideNotification.create({
          ride_id: "sos",
          ride_title: "🚨 BIKER DOWN",
          host_username: username,
          meetup_lat: null,
          meetup_lng: null,
          message: `🚨 B-DOWN: ${username} may be in an accident and needs immediate assistance.`,
          recipient_email: "",
          read: false,
        });
        setSending(false);
        setSent(true);
        setTimeout(() => setSent(false), 30000);
      },
      { timeout: 5000 }
    );
  };

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={handlePress}
        disabled={sending}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs border transition-all ${
        sent
          ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
          : "bg-red-600 border-red-700 text-white shadow-[0_0_14px_rgba(220,38,38,0.6)] hover:bg-red-500 active:scale-95"
        }`}
      >
        {sending || cancelling ? (
          <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : sent ? (
          <ShieldOff className="w-3.5 h-3.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5" />
        )}
        {cancelling ? "Removing..." : sent ? "Cancel SOS" : "B-DOWN"}
      </button>

      {/* Cancel SOS Confirmation */}
      <AnimatePresence>
        {confirmCancel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[3000]"
              onClick={() => setConfirmCancel(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-6 top-1/3 z-[3001] bg-card border border-orange-500/40 rounded-2xl p-5 shadow-2xl"
            >
              <button onClick={() => setConfirmCancel(false)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center">
                  <ShieldOff className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-orange-400">Cancel SOS Alert?</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    This will remove your B-DOWN notification and remove you from all active ride integrations.
                  </p>
                </div>
                <button
                  onClick={handleCancelSOS}
                  className="w-full py-3 rounded-xl bg-orange-600 text-white font-black text-sm hover:bg-orange-500 transition-colors"
                >
                  ✅ I'm OK — Remove Alert
                </button>
                <button onClick={() => setConfirmCancel(false)} className="text-xs text-muted-foreground">
                  Keep alert active
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Send SOS Confirmation Modal */}
      <AnimatePresence>
        {confirming && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[3000]"
              onClick={() => setConfirming(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-6 top-1/3 z-[3001] bg-card border border-red-500/40 rounded-2xl p-5 shadow-2xl"
            >
              <button onClick={() => setConfirming(false)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-red-400">BIKER DOWN</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    This will send an emergency alert with your GPS location to all nearby riders within 50 miles.
                  </p>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-red-600 text-white font-black text-sm shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:bg-red-500 transition-colors"
                >
                  🚨 SEND EMERGENCY ALERT
                </button>
                <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground">
                  Cancel — I'm OK
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}