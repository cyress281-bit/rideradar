import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithOptimism } from "@/hooks/useMutationWithOptimism";
import { deleteUserAccount } from "@/functions/deleteUserAccount";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SelectDrawer from "@/components/SelectDrawer";
import DeleteAccountDialogs from "@/components/profile/DeleteAccountDialogs";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileRidesTab from "@/components/profile/ProfileRidesTab";
import ProfileBikesTab from "@/components/profile/ProfileBikesTab";
import ProfileReviewsTab from "@/components/profile/ProfileReviewsTab";
import {
  User, Bike, Eye, EyeOff, Save, LogOut, Settings, Star, Route, MessageSquare
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "rides", label: "Rides", icon: Route },
  { id: "bikes", label: "Bikes", icon: Bike },
  { id: "reviews", label: "Reviews", icon: Star },
];

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rides");
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({
    username: "",
    profile_pic_url: "",
    bike_make: "",
    bike_model: "",
    bike_year: "",
    bike_class: "",
    motorcycle_models: [],
    ride_preferences: [],
    invisible_mode: false,
  });
  const [uploading, setUploading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setForm({
        username: u.username || u.email?.split("@")[0] || "",
        profile_pic_url: u.profile_pic_url || "",
        bike_make: u.bike_make || "",
        bike_model: u.bike_model || "",
        bike_year: u.bike_year || "",
        bike_class: u.bike_class || "",
        motorcycle_models: u.motorcycle_models || [],
        ride_preferences: u.ride_preferences || [],
        invisible_mode: u.invisible_mode || false,
      });
    }).catch(() => {});
  }, []);

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-reviews", user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewee_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: rideParticipations = [] } = useQuery({
    queryKey: ["profile-participations", user?.email],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: user.email, status: "approved" }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["profile-rides", rideParticipations.map(p => p.ride_id).join(",")],
    queryFn: async () => {
      if (!rideParticipations.length) return [];
      const rideIds = rideParticipations.map(p => p.ride_id);
      const results = await Promise.all(rideIds.slice(0, 20).map(id =>
        base44.entities.Ride.filter({ id }, "-start_time", 1).then(r => r[0]).catch(() => null)
      ));
      return results.filter(Boolean);
    },
    enabled: rideParticipations.length > 0,
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, profile_pic_url: file_url }));
      toast({ title: "Photo uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutationWithOptimism(
    async () => {
      await base44.auth.updateMe({
        username: form.username,
        profile_pic_url: form.profile_pic_url || undefined,
        bike_make: form.bike_make,
        bike_model: form.bike_model,
        bike_year: form.bike_year ? parseInt(form.bike_year) : undefined,
        bike_class: form.bike_class || undefined,
        motorcycle_models: form.motorcycle_models,
        ride_preferences: form.ride_preferences,
        invisible_mode: form.invisible_mode,
      });
    },
    { successMessage: "Profile saved!" }
  );

  const handleDeleteAccount = async (confirmationText) => {
    setIsDeletingAccount(true);
    try {
      await deleteUserAccount({ confirmationText, finalConfirmation: true });
      toast({ title: "Account deleted successfully" });
      setTimeout(() => base44.auth.logout(), 1000);
    } catch {
      toast({ title: "Deletion failed", variant: "destructive" });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen pb-24 bg-background" style={{ overscrollBehavior: 'none' }}>
      {/* Hero */}
      <ProfileHero
        user={user}
        form={form}
        uploading={uploading}
        onPicUpload={handlePicUpload}
        avgRating={avgRating}
        reviewCount={reviews.length}
        rideCount={rides.length}
        onSettingsToggle={() => setShowSettings(v => !v)}
        showSettings={showSettings}
      />

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4 bg-card/60 border-b border-border">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Username
                </Label>
                <Input
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5" /> Primary Bike
                </Label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Input value={form.bike_make} onChange={(e) => updateField("bike_make", e.target.value)} placeholder="Make" className="bg-secondary border-border" />
                  <Input value={form.bike_model} onChange={(e) => updateField("bike_model", e.target.value)} placeholder="Model" className="bg-secondary border-border" />
                  <Input value={form.bike_year} onChange={(e) => updateField("bike_year", e.target.value)} placeholder="Year" className="bg-secondary border-border" type="number" />
                </div>
                <SelectDrawer
                  value={form.bike_class}
                  onValueChange={(v) => updateField("bike_class", v)}
                  label="Select Bike Class"
                  placeholder="Bike class"
                  options={[
                    { value: "sportbike", label: "Sportbike" },
                    { value: "cruiser", label: "Cruiser" },
                    { value: "adventure", label: "Adventure" },
                    { value: "naked", label: "Naked" },
                    { value: "touring", label: "Touring" },
                    { value: "dual_sport", label: "Dual Sport" },
                    { value: "scooter", label: "Scooter" }
                  ]}
                />
              </div>

              <div className="flex items-center justify-between bg-secondary/30 rounded-xl p-3 border border-border/50">
                <div className="flex items-center gap-3">
                  {form.invisible_mode ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-primary" />}
                  <div>
                    <p className="text-sm font-medium">Invisible Mode</p>
                    <p className="text-[11px] text-muted-foreground">Hide your rides from the map</p>
                  </div>
                </div>
                <Switch checked={form.invisible_mode} onCheckedChange={(v) => updateField("invisible_mode", v)} />
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={() => base44.auth.logout()}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
                <DeleteAccountDialogs onConfirmDelete={handleDeleteAccount} isDeleting={isDeletingAccount} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-border px-5 gap-1 sticky top-0 bg-background z-10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "reviews" && reviews.length > 0 && (
                <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{reviews.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="px-5 pt-4">
        {activeTab === "rides" && <ProfileRidesTab rides={rides} user={user} />}
        {activeTab === "bikes" && (
          <ProfileBikesTab
            primaryBike={{ make: form.bike_make, model: form.bike_model, year: form.bike_year, class: form.bike_class }}
            motorcycleModels={form.motorcycle_models}
            onUpdateModels={(models) => updateField("motorcycle_models", models)}
            ridePreferences={form.ride_preferences}
            onToggleVibe={(vibe) =>
              setForm((f) => ({
                ...f,
                ride_preferences: f.ride_preferences.includes(vibe)
                  ? f.ride_preferences.filter((v) => v !== vibe)
                  : [...f.ride_preferences, vibe],
              }))
            }
          />
        )}
        {activeTab === "reviews" && <ProfileReviewsTab reviews={reviews} avgRating={avgRating} />}
      </div>
    </div>
  );
}