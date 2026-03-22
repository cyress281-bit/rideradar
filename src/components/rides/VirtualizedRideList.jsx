import React, { useEffect, useState } from "react";
import { FixedSizeList as List } from "react-window";
import RideCard from "@/components/rides/RideCard";

function EmptyState({ text }) {
  return (
    <div className="bg-secondary/30 rounded-2xl p-8 text-center border border-dashed border-border">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function RideRow({ index, style, data }) {
  const ride = data[index];

  return (
    <div style={{ ...style, top: style.top + 6, height: style.height - 12 }}>
      <RideCard ride={ride} index={0} />
    </div>
  );
}

export default function VirtualizedRideList({ rides, emptyText }) {
  const [listHeight, setListHeight] = useState(() => Math.max(window.innerHeight - 260, 320));

  useEffect(() => {
    const handleResize = () => setListHeight(Math.max(window.innerHeight - 260, 320));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (rides.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  if (rides.length < 12) {
    return (
      <div className="space-y-3">
        {rides.map((ride, index) => (
          <RideCard key={ride.id} ride={ride} index={index} />
        ))}
      </div>
    );
  }

  return (
    <List
      height={listHeight}
      width="100%"
      itemCount={rides.length}
      itemData={rides}
      itemSize={172}
      overscanCount={6}
      itemKey={(index, data) => data[index].id}
    >
      {RideRow}
    </List>
  );
}