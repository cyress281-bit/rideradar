import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithOptimism } from "@/hooks/useMutationWithOptimism";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import SelectDrawer from "@/components/SelectDrawer";
import {
  User, Bike, Shield, Eye, EyeOff, Star, Route,
  Save, LogOut, UserX, Camera, Loader, AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import MotorcycleModels from "@/components/profile/MotorcycleModels";
import RideHistory from "@/components/profile/RideHistory";

const vibeOptions = [
  { value: "chill", label: "Chill" },
  { value: "fast", label: "Fast" },
  { value: "night_ride", label: "Night Ride" },
  { value: "scenic", label: "Scenic" },
  { value: "adventure", label: "Adventure" },
  { value: "commute", label: "Commute" },
];

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const { data: blocks = [] } = useQuery({
    queryKey: ["my-blocks", user?.email],
    queryFn: () => base44.entities.UserBlock.filter({ blocker_email: user.email }),
    enabled: !!user?.email,
  });

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, profile_pic_url: file_url }));
      toast({ title: "Photo uploaded!" });
    } catch (err) {
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

  const toggleVibe = (vibe) => {
    setForm((f) => ({
      ...f,
      ride_preferences: f.ride_preferences.includes(vibe)
        ? f.ride_preferences.filter((v) => v !== vibe)
        : [...f.ride_preferences, vibe],
    }));
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleDeleteAccount = async () => {
    try {
      await base44.functions.invoke("deleteUserAccount", {});
      toast({ title: "Account deleted successfully" });
      setShowDeleteConfirm(false);
      setTimeout(() => base44.auth.logout(), 1000);
    } catch (err) {
      toast({ title: "Deletion failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ overscrollBehavior: 'none' }}>
      <div className="px-5 space-y-6">
        {/* Avatar area with upload */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4"
        >
          <label className="relative cursor-pointer group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
              {form.profile_pic_url ? (
                <img src={form.profile_pic_url} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {form.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePicUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <div>
            <p className="font-bold text-base">@{form.username || "anonymous"}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                <span className="text-xs text-muted-foreground">{user?.reputation_score || 5.0}</span>
              </div>
              <span className="text-xs text-muted-foreground">·</span>
              <div className="flex items-center gap-1">
                <Route className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{user?.total_rides || 0} rides</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Username */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Username
          </Label>
          <Input
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            className="bg-secondary border-border"
            placeholder="Choose a username"
          />
        </div>

        {/* Primary Bike info */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
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

        {/* Motorcycle models */}
        <MotorcycleModels
          models={form.motorcycle_models}
          onUpdate={(models) => updateField("motorcycle_models", models)}
        />

        {/* Ride preferences */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2">Ride Preferences</Label>
          <div className="flex flex-wrap gap-2">
            {vibeOptions.map((v) => (
              <button
                key={v.value}
                onClick={() => toggleVibe(v.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  form.ride_preferences.includes(v.value)
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary/60"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {form.invisible_mode ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium">Invisible Mode</p>
                <p className="text-[11px] text-muted-foreground">Hide your rides from the map</p>
              </div>
            </div>
            <Switch
              checked={form.invisible_mode}
              onCheckedChange={(v) => updateField("invisible_mode", v)}
            />
          </div>
        </div>

        {/* Ride History */}
        <div>
          <Label className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5" /> Ride History
          </Label>
          {user && <RideHistory userEmail={user.email} />}
        </div>

        {/* Blocked users */}
        {blocks.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5" /> Blocked Users ({blocks.length})
            </Label>
            <div className="space-y-1.5">
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-2.5 border border-border/50">
                  <span className="text-xs">{b.blocked_email}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-destructive"
                    onClick={async () => {
                      await base44.entities.UserBlock.delete(b.id);
                      queryClient.invalidateQueries({ queryKey: ["my-blocks"] });
                    }}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save */}
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground select-none"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <Button
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/10 select-none"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <UserX className="w-4 h-4 mr-2" />
          Delete Account
        </Button>

        {/* Delete Account Confirmation Dialog */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-base">Delete Account?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    This action cannot be undone. All your profile data, rides, and messages will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 select-none"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 select-none"
                  onClick={handleDeleteAccount}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}