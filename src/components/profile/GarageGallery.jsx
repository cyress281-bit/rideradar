import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader, Play, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function MediaThumbnail({ post, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const isVideo = post.media_type === "video";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative aspect-square bg-secondary/50 rounded-xl overflow-hidden group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isVideo ? (
        <video
          src={post.media_url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img src={post.media_url} alt={post.caption || "garage"} className="w-full h-full object-cover" />
      )}

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute top-1.5 left-1.5 bg-black/60 rounded-full p-1">
          <Play className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Delete overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onDelete(post.id)}
            className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 hover:bg-red-500/80 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Caption overlay */}
      {post.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-[10px] text-white/90 truncate">{post.caption}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function GarageGallery({ user }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["garage-posts", user?.email],
    queryFn: () => base44.entities.GaragePost.filter({ user_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setPendingPreview({ url, type: file.type.startsWith("video") ? "video" : "image" });
  };

  const handlePost = async () => {
    if (!pendingFile || !user) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });
    const isVideo = pendingFile.type.startsWith("video");
    const username = user.username || user.email?.split("@")[0] || "rider";
    await base44.entities.GaragePost.create({
      user_email: user.email,
      username,
      media_url: file_url,
      media_type: isVideo ? "video" : "image",
      caption: caption.trim() || undefined,
    });
    setPendingFile(null);
    setPendingPreview(null);
    setCaption("");
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["garage-posts", user.email] });
  };

  const handleDelete = async (id) => {
    await base44.entities.GaragePost.delete(id);
    queryClient.invalidateQueries({ queryKey: ["garage-posts", user.email] });
  };

  const handleCancel = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setCaption("");
  };

  return (
    <div>
      {/* Upload preview */}
      <AnimatePresence>
        {pendingPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-4 bg-secondary/40 rounded-2xl p-3 border border-border space-y-3"
          >
            <div className="aspect-video rounded-xl overflow-hidden bg-secondary/60">
              {pendingPreview.type === "video" ? (
                <video src={pendingPreview.url} className="w-full h-full object-cover" controls />
              ) : (
                <img src={pendingPreview.url} alt="preview" className="w-full h-full object-cover" />
              )}
            </div>
            <input
              type="text"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={120}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-secondary border border-border text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={uploading}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground flex items-center justify-center gap-2"
              >
                {uploading ? <Loader className="w-4 h-4 animate-spin" /> : "Post to Garage"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* Add button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors group"
        >
          <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[9px] text-muted-foreground group-hover:text-primary transition-colors">Add</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {posts.map((post) => (
          <MediaThumbnail key={post.id} post={post} onDelete={handleDelete} />
        ))}

        {posts.length === 0 && !pendingPreview && (
          <div className="col-span-2 aspect-square flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Post your bike &amp; rides</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}