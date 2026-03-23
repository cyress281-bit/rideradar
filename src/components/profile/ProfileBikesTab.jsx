import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Plus, Trash2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SelectDrawer from "@/components/SelectDrawer";

const VIBE_OPTIONS = [
  { value: "chill", label: "Chill", emoji: "😎" },
  { value: "fast", label: "Fast", emoji: "⚡" },
  { value: "night_ride", label: "Night Ride", emoji: "🌙" },
  { value: "scenic", label: "Scenic", emoji: "🌄" },
  { value: "adventure", label: "Adventure", emoji: "🏕️" },
  { value: "commute", label: "Commute", emoji: "🛣️" },
];

const BIKE_CLASSES = [
  { value: "sportbike", label: "Sportbike" },
  { value: "cruiser", label: "Cruiser" },
  { value: "adventure", label: "Adventure" },
  { value: "naked", label: "Naked" },
  { value: "touring", label: "Touring" },
  { value: "dual_sport", label: "Dual Sport" },
  { value: "scooter", label: "Scooter" },
];

export default function ProfileBikesTab({ primaryBike, motorcycleModels, onUpdateModels, ridePreferences, onToggleVibe }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBike, setNewBike] = useState({ year: "", make: "", model: "", class: "" });

  const handleAddBike = () => {
    if (!newBike.make || !newBike.model) return;
    onUpdateModels([...motorcycleModels, { ...newBike }]);
    setNewBike({ year: "", make: "", model: "", class: "" });
    setShowAddForm(false);
  };

  const handleRemove = (idx) => {
    onUpdateModels(motorcycleModels.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Primary Bike */}
      {(primaryBike.make || primaryBike.model) && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" /> Primary Bike
          </p>
          <div className="bg-card border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bike className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {[primaryBike.year, primaryBike.make, primaryBike.model].filter(Boolean).join(" ")}
                </p>
                {primaryBike.class && (
                  <p className="text-xs text-muted-foreground capitalize">{primaryBike.class}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Garage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">Garage ({motorcycleModels.length})</p>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1 text-xs text-primary font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Bike
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={newBike.year} onChange={e => setNewBike(b => ({ ...b, year: e.target.value }))} placeholder="Year" className="bg-secondary border-border" type="number" />
                  <Input value={newBike.make} onChange={e => setNewBike(b => ({ ...b, make: e.target.value }))} placeholder="Make" className="bg-secondary border-border" />
                  <Input value={newBike.model} onChange={e => setNewBike(b => ({ ...b, model: e.target.value }))} placeholder="Model" className="bg-secondary border-border" />
                </div>
                <SelectDrawer
                  value={newBike.class}
                  onValueChange={v => setNewBike(b => ({ ...b, class: v }))}
                  label="Bike Class"
                  placeholder="Bike class"
                  options={BIKE_CLASSES}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddBike} size="sm" className="flex-1 bg-primary">Add</Button>
                  <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost" className="flex-1">Cancel</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {motorcycleModels.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-2xl">
            <Bike className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No bikes in your garage yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {motorcycleModels.map((bike, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-card border border-border/60 rounded-xl p-3"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                  <Bike className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {[bike.year, bike.make, bike.model].filter(Boolean).join(" ")}
                  </p>
                  {bike.class && <p className="text-xs text-muted-foreground capitalize">{bike.class}</p>}
                </div>
                <button onClick={() => handleRemove(idx)} className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Ride Preferences */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">Ride Style</p>
        <div className="flex flex-wrap gap-2">
          {VIBE_OPTIONS.map((v) => (
            <button
              key={v.value}
              onClick={() => onToggleVibe(v.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                ridePreferences.includes(v.value)
                  ? "bg-primary/15 text-primary border-primary/30 scale-105"
                  : "bg-secondary/40 text-muted-foreground border-border"
              }`}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}