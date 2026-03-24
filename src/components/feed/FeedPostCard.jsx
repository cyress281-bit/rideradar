import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Wrench, Camera, Route, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG = {
  ride:        { icon: Route,   color: "text-primary",    bg: "bg-primary/10",    label: "Ride" },
  photo:       { icon: Camera,  color: "text-blue-400",   bg: "bg-blue-400/10",   label: "Photo" },
  maintenance: { icon: Wrench,  color: "text-amber-400",  bg: "bg-amber-400/10",  label: "Maintenance" },
};

export default function FeedPostCard({ post, currentUser }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const liked = currentUser && Array.isArray(post.likes) && post.likes.includes(currentUser.email);

  const { data: comments = [] } = useQuery({
    queryKey: ["feed-comments", post.id],
    queryFn: () => base44.entities.FeedComment.filter({ post_id: post.id }, "created_date", 50),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: ({ newLikes }) =>
      base44.entities.FeedPost.update(post.id, { likes: newLikes, likes_count: newLikes.length }),
    onMutate: async ({ newLikes }) => {
      await qc.cancelQueries({ queryKey: ["feed-posts"] });
      const prev = qc.getQueryData(["feed-posts"]);
      qc.setQueryData(["feed-posts"], (old = []) =>
        old.map((p) => p.id === post.id ? { ...p, likes: newLikes, likes_count: newLikes.length } : p)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(["feed-posts"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["feed-posts"] }),
  });

  const toggleLike = () => {
    if (!currentUser) return;
    const likes = Array.isArray(post.likes) ? [...post.likes] : [];
    const newLikes = liked ? likes.filter((e) => e !== currentUser.email) : [...likes, currentUser.email];
    likeMutation.mutate({ newLikes });
  };

  const submitComment = useMutation({
    mutationFn: async () => {
      if (!commentText.trim() || !currentUser) return;
      await base44.entities.FeedComment.create({
        post_id: post.id,
        user_email: currentUser.email,
        username: currentUser.username || currentUser.email.split("@")[0],
        profile_pic_url: currentUser.profile_pic_url || "",
        text: commentText.trim(),
      });
      setCommentText("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed-comments", post.id] }),
  });

  const deletePost = useMutation({
    mutationFn: () => base44.entities.FeedPost.delete(post.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed-posts"] }),
  });

  const cfg = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.photo;
  const Icon = cfg.icon;
  const initials = post.username?.[0]?.toUpperCase() || "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center flex-shrink-0">
            {post.profile_pic_url
              ? <img src={post.profile_pic_url} alt={post.username} className="w-full h-full object-cover" />
              : <span className="text-sm font-bold text-primary">{initials}</span>
            }
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">@{post.username}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-3 h-3" />{cfg.label}
          </span>
          {currentUser?.email === post.user_email && (
            <button onClick={() => deletePost.mutate()} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="aspect-[4/3] bg-secondary overflow-hidden">
          <img src={post.media_url} alt="post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3">
        {post.ride_title && (
          <p className="text-[10px] text-primary/70 font-semibold mb-1 flex items-center gap-1">
            <Route className="w-3 h-3" /> {post.ride_title}
          </p>
        )}
        <p className="text-sm leading-relaxed text-foreground">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pb-3 border-t border-border/50 pt-2.5">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-red-400" : ""}`} />
          {post.likes_count || 0}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Comments
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="px-4 pt-3 pb-2 space-y-2.5 max-h-60 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-primary">
                    {c.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="bg-secondary/50 rounded-xl px-3 py-1.5 flex-1">
                    <span className="text-[10px] font-bold text-primary">@{c.username} </span>
                    <span className="text-xs text-foreground">{c.text}</span>
                  </div>
                </div>
              ))}
            </div>
            {currentUser && (
              <div className="flex gap-2 px-4 pb-3">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment.mutate()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => submitComment.mutate()}
                  disabled={!commentText.trim()}
                  className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}