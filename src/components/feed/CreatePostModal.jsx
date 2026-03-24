import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Camera, Route, Wrench, ImagePlus, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const POST_TYPES = [
  { value: "photo",       label: "Photo",       icon: Camera, color: "text-blue-400",  bg: "bg-blue-400/10" },
  { value: "ride",        label: "Ride",        icon: Route,  color: "text-primary",   bg: "bg-primary/10" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10" },
];

export default function CreatePostModal({ user, onClose }) {
  const qc = useQueryClient();
  const [postType, setPostType] = useState("photo");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMediaUrl(file_url);
    setUploading(false);
  };

  const submit = useMutation({
    mutationFn: async () => {
      const username = user.username || user.email.split("@")[0];
      await base44.entities.FeedPost.create({
        user_email: user.email,
        username,
        profile_pic_url: user.profile_pic_url || "",
        post_type: postType,
        content: content.trim(),
        media_url: mediaUrl || undefined,
        likes: [],
        likes_count: 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed-posts"] });
      onClose();
    },
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-card rounded-t-3xl border-t border-border p-5 pb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">New Post</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2 mb-4">
            {POST_TYPES.map((t) => {
              const Icon = t.icon;
              const active = postType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setPostType(t.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    active ? `${t.bg} ${t.color} border-current` : "border-border text-muted-foreground bg-secondary/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Media upload */}
          <label className="block mb-3 cursor-pointer">
            {mediaUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-secondary">
                <img src={mediaUrl} alt="upload" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.preventDefault(); setMediaUrl(""); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border border-dashed border-border rounded-xl p-3 text-muted-foreground text-xs">
                {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Add photo (optional)"}
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
          />

          <Button
            onClick={() => submit.mutate()}
            disabled={!content.trim() || submit.isPending}
            className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl"
          >
            {submit.isPending ? "Posting..." : "Share Post"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}