import React from "react";
import { Camera, Loader, Settings, Star, Route, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileHero({ user, form, uploading, onPicUpload, avgRating, reviewCount, rideCount, onSettingsToggle, showSettings }) {
  return (
    <div className="relative px-5 pt-5 pb-4">
      {/* Settings toggle */}
      <button
        onClick={onSettingsToggle}
        className={`absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showSettings ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}
        aria-label="Toggle settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Avatar + info */}
      <div className="flex items-end gap-4 mb-4">
        <label className="relative cursor-pointer group flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
            {form.profile_pic_url ? (
              <img src={form.profile_pic_url} alt="profile" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <span className="text-3xl font-black text-primary">
                {form.username?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? <Loader className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
          </div>
          <input type="file" accept="image/*" onChange={onPicUpload} disabled={uploading} className="hidden" />
        </label>

        <div className="flex-1 pb-1">
          <h1 className="text-xl font-black">@{form.username || "anonymous"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
          {form.bike_make && form.bike_model && (
            <p className="text-xs text-primary/80 mt-1 font-medium">
              {form.bike_year} {form.bike_make} {form.bike_model}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Route className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-black text-foreground">{rideCount}</p>
          <p className="text-[10px] text-muted-foreground">Rides</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-lg font-black text-foreground">{avgRating ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">Avg Rating</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-lg font-black text-foreground">{reviewCount}</p>
          <p className="text-[10px] text-muted-foreground">Reviews</p>
        </motion.div>
      </div>
    </div>
  );
}