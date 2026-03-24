import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";

export default function HostControls({ ride, rideId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: ride.title,
    vibe: ride.vibe || "",
    requirements: ride.requirements || "",
    start_time: ride.start_time || "",
    duration_minutes: String(ride.duration_minutes || 60),
    status_message: ride.status_message || "",
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Ride.update(rideId, {
      title: form.title,
      vibe: form.vibe || undefined,
      requirements: form.requirements || undefined,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : ride.start_time,
      duration_minutes: parseInt(form.duration_minutes),
      status_message: form.status_message || undefined,
    });
    queryClient.invalidateQueries({ queryKey: ["ride-detail", rideId] });
    queryClient.invalidateQueries({ queryKey: ["rides-home"] });
    queryClient.invalidateQueries({ queryKey: ["rides-grid"] });
    toast({ title: "Ride updated!" });
    setSaving(false);
    setOpen(false);
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this ride? It will be removed from your ride history.")) return;
    setCancelling(true);
    // Delete the ride entirely so it doesn't appear in history
    await base44.entities.Ride.delete(rideId);
    toast({ title: "Ride cancelled and removed." });
    navigate("/");
  };

  // Only allow editing meetup/active rides; only allow cancel on meetup rides
  const canEdit = ride.status === "meetup" || ride.status === "active";
  const canCancel = ride.status === "meetup";

  if (!canEdit && !canCancel) return null;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex gap-2">
        {canEdit && (
          <button
            onClick={() => setOpen(o => !o)}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl bg-secondary border border-border hover:bg-secondary/80 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Ride
            {open ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {cancelling ? "Cancelling..." : "Cancel Ride"}
          </button>
        )}
      </div>

      {/* Edit form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/30 border border-border rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Ride Name</p>
                <Input value={form.title} onChange={e => update("title", e.target.value)} className="bg-secondary border-border" />
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Host Message</p>
                <Input value={form.status_message} onChange={e => update("status_message", e.target.value)} placeholder="e.g. Running 10 min late..." className="bg-secondary border-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Vibe</p>
                  <Select value={form.vibe} onValueChange={v => update("vibe", v)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Vibe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chill">Chill</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="night_ride">Night Ride</SelectItem>
                      <SelectItem value="scenic">Scenic</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="commute">Commute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Duration</p>
                  <Select value={form.duration_minutes} onValueChange={v => update("duration_minutes", v)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {ride.status === "meetup" && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Start Time</p>
                  <DateTimePicker
                    value={form.start_time ? new Date(form.start_time).toISOString().slice(0,16) : ""}
                    onChange={v => update("start_time", v)}
                    minDate={new Date()}
                  />
                </div>
              )}

              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Requirements</p>
                <Textarea value={form.requirements} onChange={e => update("requirements", e.target.value)} className="bg-secondary border-border h-16" />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-9 text-xs font-bold">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-3">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}