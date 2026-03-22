import React from "react";
import RideCard from "../rides/RideCard";

export default function RideSection({ title, rides, emptyText }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {rides.length > 0 && (
          <span className="text-[11px] text-muted-foreground">{rides.length} ride{rides.length !== 1 ? "s" : ""}</span>
        )}
      </div>
      {rides.length === 0 ? (
        <div className="bg-secondary/30 rounded-2xl p-6 text-center border border-dashed border-border">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride, i) => (
            <RideCard key={ride.id} ride={ride} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}