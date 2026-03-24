import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader, Route, Eye, EyeOff, Save, LogOut, UserX, Settings, Grid3X3, Bike, Pencil, X, Check, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import MotorcycleModels from "@/components/profile/MotorcycleModels";
import RideHistory from "@/components/profile/RideHistory";
import GarageGallery from "@/components/profile/GarageGallery";


const TABS = [
  { id: "garage", label: "Garage", icon: Grid3X3 },
  { id: "rides", label: "Rides", icon: Route },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("garage");
  const [editingProfile, setEditingProfile] = useState(false);
  const [form, setForm] = useState({
    username: "", bio: "", profile_pic_url: "", bike_make: "", bike_model: "",
    bike_year: "", bike_class: "", motorcycle_models: [], invisible_mode: false, sos_notifications: true,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setForm({
        username: u.username || u.email?.split("@")[0] || "",
        bio: u.bio || "",
        profile_pic_url: u.profile_pic_url || "",
        bike_make: u.bike_make || "",
        bike_model: u.bike_model || "",
        bike_year: u.bike_year || "",
        bike_class: u.bike_class || "",
        motorcycle_models: u.motorcycle_models || [],
        invisible_mode: u.invisible_mode || false,
        sos_notifications: u.sos_notifications !== false,
      });
    }).catch(() => {});
  }, []);

  const { data: blocks = [] } = useQuery({
    queryKey: ["my-blocks", user?.email],
    queryFn: () => base44.entities.UserBlock.filter({ blocker_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: garagePosts = [] } = useQuery({
    queryKey: ["garage-posts-count", user?.email],
    queryFn: () => base44.entities.GaragePost.filter({ user_email: user.email }, "-created_date", 1),
    enabled: !!user?.email,
  });

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, profile_pic_url: file_url }));
    await base44.auth.updateMe({ profile_pic_url: file_url });
    toast({ title: "Photo updated!" });
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        username: form.username,
        bio: form.bio,
        profile_pic_url: form.profile_pic_url || undefined,
        bike_make: form.bike_make,
        bike_model: form.bike_model,
        bike_year: form.bike_year ? parseInt(form.bike_year) : undefined,
        bike_class: form.bike_class || undefined,
        motorcycle_models: form.motorcycle_models,
        invisible_mode: form.invisible_mode,
        sos_notifications: form.sos_notifications,
      });
    },
    onSuccess: () => toast({ title: "Profile saved!" }),
  });

  const { theme, toggle: toggleTheme } = useTheme();
  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const initials = form.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen pb-28">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-5 px-5">
        {/* Avatar */}
        <motion.label
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative cursor-pointer group mb-3"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 overflow-hidden shadow-[0_0_20px_rgba(0,240,50,0.25)]">
            {form.profile_pic_url ? (
              <img src={form.profile_pic_url} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">{initials}</span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
            <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <input type="file" accept="image/*" onChange={handlePicUpload} disabled={uploading} className="hidden" />
        </motion.label>

        {!editingProfile ? (
          /* Read-only view */
          <div className="flex flex-col items-center w-full">
            <h2 className="text-lg font-bold">@{form.username || "anonymous"}</h2>
            {(form.bike_make || form.bike_model) && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Bike className="w-3.5 h-3.5" />
                <span>{[form.bike_year, form.bike_make, form.bike_model].filter(Boolean).join(" ")}</span>
              </div>
            )}
            {form.bio && (
              <p className="text-sm text-center text-muted-foreground mt-2 max-w-xs leading-snug">{form.bio}</p>
            )}
            {/* Stats row */}
            <div className="flex items-center gap-8 mt-4">
              <div className="text-center">
                <p className="text-base font-bold">{user?.total_rides || 0}</p>
                <p className="text-[10px] text-muted-foreground">Rides</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold">{user?.friends_count || 0}</p>
                <p className="text-[10px] text-muted-foreground">Friends</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold">{user?.likes_count || 0}</p>
                <p className="text-[10px] text-muted-foreground">Likes</p>
              </div>
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="mt-4 flex items-center gap-1.5 px-5 py-2 rounded-lg border border-border bg-secondary/50 text-xs font-semibold hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        ) : (
          /* Inline edit form */
          <div className="w-full space-y-3 mt-2">
            {/* Username */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Username</Label>
              <Input value={form.username} onChange={(e) => updateField("username", e.target.value)} className="bg-secondary border-border" placeholder="Choose a username" />
            </div>
            {/* Bio */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Bio</Label>
              <textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Tell riders about yourself..."
                maxLength={150}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right -mt-0.5">{form.bio.length}/150</p>
            </div>
            {/* Primary Bike */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Primary Bike</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input value={form.bike_make} onChange={(e) => updateField("bike_make", e.target.value)} placeholder="Make" className="bg-secondary border-border" />
                <Input value={form.bike_model} onChange={(e) => updateField("bike_model", e.target.value)} placeholder="Model" className="bg-secondary border-border" />
                <Input value={form.bike_year} onChange={(e) => updateField("bike_year", e.target.value)} placeholder="Year" className="bg-secondary border-border" type="number" />
              </div>
              <Select value={form.bike_class} onValueChange={(v) => updateField("bike_class", v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Bike class" />
                </SelectTrigger>
                <SelectContent>
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
            {/* Motorcycle models */}
            <MotorcycleModels models={form.motorcycle_models} onUpdate={(models) => updateField("motorcycle_models", models)} />
            {/* Save / Cancel */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => { saveMutation.mutate(); setEditingProfile(false); }}
                disabled={saveMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
              >
                <Check className="w-4 h-4 mr-1" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditingProfile(false)} className="flex-1 rounded-xl">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors relative ${
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4">
        {activeTab === "garage" && <GarageGallery user={user} />}

        {activeTab === "rides" && (
          <div>
            {user && <RideHistory userEmail={user.email} />}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-5">
            {/* Theme */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <div>
                    <p className="text-sm font-medium">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                    <p className="text-[11px] text-muted-foreground">Switch app appearance</p>
                  </div>
                </div>
                <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {form.invisible_mode ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-primary" />}
                  <div>
                    <p className="text-sm font-medium">Invisible Mode</p>
                    <p className="text-[11px] text-muted-foreground">Hide your rides from the map</p>
                  </div>
                </div>
                <Switch checked={form.invisible_mode} onCheckedChange={(v) => updateField("invisible_mode", v)} />
              </div>
            </div>

            {/* SOS Notifications */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🚨</span>
                  <div>
                    <p className="text-sm font-medium">B-DOWN Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Receive SOS emergency alerts from nearby riders</p>
                  </div>
                </div>
                <Switch checked={form.sos_notifications} onCheckedChange={(v) => updateField("sos_notifications", v)} />
              </div>
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
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive"
                        onClick={async () => {
                          await base44.entities.UserBlock.delete(b.id);
                          queryClient.invalidateQueries({ queryKey: ["my-blocks"] });
                        }}
                      >Unblock</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl">
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>

            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>

            <div className="border-t border-border/50 pt-4">
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  if (!window.confirm("Delete your account? This cannot be undone.")) return;
                  const secondConfirm = window.prompt('Type "DELETE" to confirm');
                  if (secondConfirm !== "DELETE") return;
                  await base44.auth.updateMe({ account_deleted: true, username: "[deleted]" });
                  base44.auth.logout();
                }}
              >
                <UserX className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}