import React from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StarRating({ rating, size = "sm" }) {
  const w = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${w} ${i <= rating ? "text-amber-400" : "text-border"}`}
          fill={i <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-4 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-4">{count}</span>
    </div>
  );
}

export default function ProfileReviewsTab({ reviews, avgRating }) {
  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    label: n,
    count: reviews.filter(r => r.rating === n).length,
  }));

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <Star className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">No reviews yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Reviews from ride partners will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Summary */}
      <div className="bg-card border border-border/60 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-black text-foreground">{avgRating}</p>
            <StarRating rating={Math.round(parseFloat(avgRating))} size="sm" />
            <p className="text-[10px] text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ label, count }) => (
              <RatingBar key={label} label={label} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-3">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border/60 rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-bold">@{review.reviewer_username || review.reviewer_email?.split("@")[0]}</p>
                {review.ride_title && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">on "{review.ride_title}"</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <StarRating rating={review.rating} size="sm" />
                <p className="text-[10px] text-muted-foreground">
                  {review.created_date
                    ? formatDistanceToNow(new Date(review.created_date), { addSuffix: true })
                    : ""}
                </p>
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-foreground/80 leading-relaxed border-t border-border/40 pt-2 mt-2">
                "{review.comment}"
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}