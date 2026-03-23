import React, { useState, useEffect, Suspense } from "react";
import { useTabNavigation } from "@/context/TabNavigationContext";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SelectDrawer from "@/components/SelectDrawer";
import { ArrowLeft, MapPin, Clock, Sparkles, Zap, CalendarClock, Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { mapTileLayerProps } from "@/lib/mapTileConfig";

const pinIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:40px;height:40px;background:#f97316;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #7c2d12;box-shadow:0 0 20px rgba(249,115,22,0.5)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

export default function CreateRide() {
   const { goBack } = useTabNavigation();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState(null);
  const [rideMode, setRideMode] = useState("now"); // "now" | "schedule"
  const [rideType, setRideType] = useState("casual"); // "casual" | "planned_event"
  const [eventFormat, setEventFormat] = useState("stationary"); // "stationary" | "route"
  const [form, setForm] = useState({
    title: "",
    start_time: "",
    duration_minutes: "60",
    vibe: "",
    requirements: "",
    meetup_address: "",
    location_name: "",
    registration_fee: "",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) {
      toast({ title: "Tap the map to set your meetup point", variant: "destructive" });
      return;
    }
    if (!form.title) {
      toast({ title: "Please fill in the ride name", variant: "destructive" });
      return;
    }
    if (rideMode === "schedule" && !form.start_time) {
      toast({ title: "Please set a start time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const username = user?.username || user?.email?.split("@")[0] || "rider";
    const startTime = rideMode === "now" ? new Date().toISOString() : new Date(form.start_time).toISOString();

    const ride = await base44.entities.Ride.create({
      title: form.title,
      host_username: username,
      host_email: user?.email,
      ride_type: rideType,
      event_format: rideType === "planned_event" ? eventFormat : undefined,
      location_name: rideType === "planned_event" ? form.location_name : undefined,
      meetup_lat: position[0],
      meetup_lng: position[1],
      meetup_address: form.meetup_address,
      start_time: startTime,
      duration_minutes: parseInt(form.duration_minutes),
      vibe: form.vibe || undefined,
      requirements: form.requirements || undefined,
      status: "meetup",
      rider_count: 1,
    });

    // If "Ride Now" — broadcast a notification to nearby riders
    if (rideMode === "now") {
      await base44.entities.RideNotification.create({
        ride_id: ride.id,
        ride_title: form.title,
        host_username: username,
        meetup_lat: position[0],
        meetup_lng: position[1],
        message: `Ride starting nearby — Join?`,
        recipient_email: "",
        read: false,
      });
    }

    await base44.entities.RideParticipant.create({
      ride_id: ride.id,
      user_email: user?.email,
      username: username,
      status: "approved",
      role: "host",
    });

    toast({ title: "Ride created! It's now on the grid." });
     setSubmitting(false);
     goBack();
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen pb-24" style={{ overscrollBehavior: 'none' }}>


      <form onSubmit={handleSubmit} className="px-5 space-y-5">
        {/* Map picker */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Meetup Location
          </Label>
          <div className="rounded-2xl overflow-hidden border border-border h-48">
            <Suspense fallback={<div className="w-full h-full bg-secondary/40 animate-pulse" />}>
              <MapContainer
                center={[34.05, -118.25]}
                zoom={11}
                className="h-full w-full"
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer {...mapTileLayerProps} />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </Suspense>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Tap the map to set your meetup point</p>
        </div>

        <Input
          placeholder="Meetup address (optional)"
          value={form.meetup_address}
          onChange={(e) => updateField("meetup_address", e.target.value)}
          className="bg-secondary border-border"
        />

        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Ride Name
          </Label>
          <Input
            placeholder="e.g. Sunset PCH Run"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="bg-secondary border-border"
          />
        </div>

        {/* Ride Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-border bg-secondary/40 p-1 gap-1">
          <button
            type="button"
            onClick={() => setRideType("casual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              rideType === "casual"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-4 h-4" /> Casual Ride
          </button>
          <button
            type="button"
            onClick={() => setRideType("planned_event")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              rideType === "planned_event"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" /> Planned Event
          </button>
        </div>

        {/* Ride Now / Schedule toggle */}
        <div className="flex rounded-xl overflow-hidden border border-border bg-secondary/40 p-1 gap-1">
          <button
            type="button"
            onClick={() => setRideMode("now")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              rideMode === "now"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-4 h-4" /> Ride Now
          </button>
          <button
            type="button"
            onClick={() => setRideMode("schedule")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              rideMode === "schedule"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarClock className="w-4 h-4" /> Schedule Later
          </button>
        </div>

        {/* Event format for planned events */}
        {rideType === "planned_event" && (
          <div className="flex rounded-xl overflow-hidden border border-border bg-secondary/40 p-1 gap-1">
            <button
              type="button"
              onClick={() => setEventFormat("stationary")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                eventFormat === "stationary"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📍 Stationary Gathering
            </button>
            <button
              type="button"
              onClick={() => setEventFormat("route")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                eventFormat === "route"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🛣️ Planned Route
            </button>
          </div>
        )}

        {/* Location name for planned events */}
        {rideType === "planned_event" && (
          <Input
            placeholder="Venue or business name"
            value={form.location_name}
            onChange={(e) => updateField("location_name", e.target.value)}
            className="bg-secondary border-border"
          />
        )}

        {rideMode === "now" && (
          <div className="flex items-start gap-2.5 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-primary/90 leading-snug">
              Nearby riders will get an instant notification: <span className="font-semibold">"Ride starting nearby — Join?"</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {rideMode === "schedule" && (
          <div>
            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Start Time
            </Label>
            <Input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => updateField("start_time", e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          )}
          <div className={rideMode === "now" ? "col-span-2" : ""}>
            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Duration
            </Label>
            <SelectDrawer
              value={form.duration_minutes}
              onValueChange={(v) => updateField("duration_minutes", v)}
              label="Select Duration"
              options={[
                { value: "30", label: "30 min" },
                { value: "60", label: "1 hour" },
                { value: "120", label: "2 hours" },
                { value: "180", label: "3 hours" }
              ]}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Vibe
          </Label>
          <SelectDrawer
            value={form.vibe}
            onValueChange={(v) => updateField("vibe", v)}
            label="Select Vibe"
            placeholder="Select vibe"
            options={[
              { value: "chill", label: "Chill" },
              { value: "fast", label: "Fast" },
              { value: "night_ride", label: "Night Ride" },
              { value: "scenic", label: "Scenic" },
              { value: "adventure", label: "Adventure" },
              { value: "commute", label: "Commute" }
            ]}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2">Requirements (preferred, optional)</Label>
          <Textarea
            placeholder="e.g. Full gear, Cardo comms, etc."
            value={form.requirements}
            onChange={(e) => updateField("requirements", e.target.value)}
            className="bg-secondary border-border h-20"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl"
        >
          {submitting
            ? "Creating..."
            : rideType === "planned_event"
            ? `📅 Create ${eventFormat === "stationary" ? "Gathering" : "Event Route"}`
            : rideMode === "now"
            ? "🚀 Ride Now — Notify Riders"
            : "📅 Schedule Ride"}
        </Button>
      </form>
    </div>
  );
}