import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Clock, Sparkles, Zap, CalendarClock } from "lucide-react";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { useToast } from "@/components/ui/use-toast";

const pinIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:40px;height:40px;background:#f97316;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #7c2d12;box-shadow:0 0 20px rgba(249,115,22,0.5)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapPanner({ position }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (position && position !== prev.current) {
      map.flyTo(position, 14, { duration: 1 });
      prev.current = position;
    }
  }, [position, map]);
  return null;
}

function LocationPicker({ position, setPosition, onMapClick }) {
  useMapEvents({
    click(e) {
      const pos = [e.latlng.lat, e.latlng.lng];
      setPosition(pos);
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

export default function CreateRide() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState(null);
  const [rideMode, setRideMode] = useState("now");
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    start_time: "",
    duration_minutes: "60",
    vibe: "",
    requirements: "",
    meetup_address: "",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Address → pin (geocode on input)
  const geocodeAddress = useCallback((address) => {
    if (!address || address.length < 5) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch {}
      setGeocoding(false);
    }, 700);
  }, []);

  // Pin → address (reverse geocode on map click)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.display_name) {
        updateField("meetup_address", data.display_name);
      }
    } catch {}
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
    navigate(`/ride/${ride.id}`);
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen pb-24">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold">Create Ride</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 space-y-5">
        {/* Map picker */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Meetup Location
          </Label>
          <div className="rounded-2xl overflow-hidden border border-border h-48">
            <MapContainer
              center={[34.05, -118.25]}
              zoom={11}
              className="h-full w-full"
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <MapPanner position={position} />
              <LocationPicker position={position} setPosition={setPosition} onMapClick={reverseGeocode} />
            </MapContainer>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Tap the map to set your meetup point</p>
        </div>

        <div className="relative">
          <Input
            placeholder="Meetup address — type to drop a pin"
            value={form.meetup_address}
            onChange={(e) => {
              updateField("meetup_address", e.target.value);
              geocodeAddress(e.target.value);
            }}
            className="bg-secondary border-border pr-8"
          />
          {geocoding && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

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
              <CalendarClock className="w-3.5 h-3.5" /> Date &amp; Time
            </Label>
            <DateTimePicker
              value={form.start_time}
              onChange={(v) => updateField("start_time", v)}
              minDate={new Date(Date.now() + 5 * 60000)}
            />
          </div>
          )}
          <div className={rideMode === "now" ? "col-span-2" : ""}>
            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Duration
            </Label>
            <Select value={form.duration_minutes} onValueChange={(v) => updateField("duration_minutes", v)}>
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

        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Vibe
          </Label>
          <Select value={form.vibe} onValueChange={(v) => updateField("vibe", v)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select vibe" />
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
          {submitting ? "Creating..." : rideMode === "now" ? "🚀 Ride Now — Notify Riders" : "📅 Schedule Ride"}
        </Button>
      </form>
    </div>
  );
}