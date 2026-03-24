import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Route, Camera, Wrench, SlidersHorizontal } from "lucide-react";
import FeedPostCard from "@/components/feed/FeedPostCard";
import CreatePostModal from "@/components/feed/CreatePostModal";
import { motion } from "framer-motion";

const FILTERS = [
  { value: "all",         label: "All" },
  { value: "ride",        label: "Rides",        icon: Route },
  { value: "photo",       label: "Photos",       icon: Camera },
  { value: "maintenance", label: "Maintenance",  icon: Wrench },
];

export default function Feed() {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed-posts"],
    queryFn: () => base44.entities.FeedPost.list("-created_date", 50),
    refetchInterval: 20000,
  });

  // Real-time updates
  useEffect(() => {
    const unsub = base44.entities.FeedPost.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["feed-posts"] });
    });
    return unsub;
  }, [qc]);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.post_type === filter);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Feed</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Post
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground bg-secondary/40 hover:bg-secondary"
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 pt-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
              <SlidersHorizontal className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">No posts yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share a ride or photo!</p>
          </motion.div>
        )}

        {filtered.map((post) => (
          <FeedPostCard key={post.id} post={post} currentUser={user} />
        ))}
      </div>

      {showCreate && user && (
        <CreatePostModal user={user} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}