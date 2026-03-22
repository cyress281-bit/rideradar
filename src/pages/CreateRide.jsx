import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Clock, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState(null);
  const [form, setForm] = useState({
    title: "",
    start_time: "",
    duration_minutes: "60",
    vibe: "",
    bike_class: "any",
    max_riders: "",
    requirements: "",
    meetup_address: "",
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
    if (!form.title || !form.start_time) {
      toast({ title: "Please fill in the ride name and start time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const username = user?.username || user?.email?.split("@")[0] || "rider";

    const ride = await base44.entities.Ride.create({
      title: form.title,
      host_username: username,
      host_email: user?.email,
      meetup_lat: position[0],
      meetup_lng: position[1],
      meetup_address: form.meetup_address,
      start_time: new Date(form.start_time).toISOString(),
      duration_minutes: parseInt(form.duration_minutes),
      vibe: form.vibe || undefined,
      bike_class: form.bike_class,
      max_riders: form.max_riders ? parseInt(form.max_riders) : undefined,
      requirements: form.requirements || undefined,
      status: "meetup",
      rider_count: 1,
    });

    await base44.entities.RideParticipant.create({
      ride_id: ride.id,
      user_email: user?.email,
      username: username,
      status: "approved",
      role: "host",
    });

    toast({ title: "Ride created! It's now on the grid." });
    navigate(`/rides/${ride.id}`);
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
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
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

        <div className="grid grid-cols-2 gap-3">
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
          <div>
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

        <div className="grid grid-cols-2 gap-3">
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
            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5" /> Bike Class
            </Label>
            <Select value={form.bike_class} onValueChange={(v) => updateField("bike_class", v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="sportbike">Sportbike</SelectItem>
                <SelectItem value="cruiser">Cruiser</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="naked">Naked</SelectItem>
                <SelectItem value="touring">Touring</SelectItem>
                <SelectItem value="dual_sport">Dual Sport</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Max Riders (optional)
          </Label>
          <Input
            type="number"
            placeholder="No limit"
            value={form.max_riders}
            onChange={(e) => updateField("max_riders", e.target.value)}
            className="bg-secondary border-border"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2">Requirements (optional)</Label>
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
          {submitting ? "Creating..." : "Create Ride & Go Live"}
        </Button>
      </form>
    </div>
  );
}