import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, UserPlus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function RiderProfileModal({ riderEmail, username, onClose }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    base44.entities.UserFriend.filter({
      $or: [
        { user_email: user.email, friend_email: riderEmail, status: "accepted" },
        { user_email: riderEmail, friend_email: user.email, status: "accepted" }
      ]
    }).then((friends) => {
      setIsFriend(friends.length > 0);
    }).catch(() => {});
  }, [user, riderEmail]);

  const handleAddFriend = async () => {
    if (!user || isFriend || loading) return;
    setLoading(true);
    await base44.entities.UserFriend.create({
      user_email: user.email,
      friend_email: riderEmail,
      status: "accepted",
    });
    setIsFriend(true);
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ["friends", user.email] });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[1001] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Rider Profile</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{username?.[0]?.toUpperCase() || "?"}</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">@{username}</p>
            <p className="text-xs text-muted-foreground">{riderEmail}</p>
          </div>
        </div>

        {user && riderEmail !== user.email && (
          <button
            onClick={handleAddFriend}
            disabled={isFriend || loading}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              isFriend
                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25"
            }`}
          >
            {isFriend ? (
              <><Check className="w-4 h-4" /> Friends</>
            ) : loading ? (
              "Adding..."
            ) : (
              <><UserPlus className="w-4 h-4" /> Add Friend</>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}