import React, { useEffect, useRef } from "react";
import { Users, Radio } from "lucide-react";
import { motion } from "framer-motion";

// Deterministic pseudo-random dots based on rider count
function generateDots(count) {
  const dots = [];
  for (let i = 0; i < Math.min(count, 12); i++) {
    const seed = i * 137.5;
    const angle = (seed % 360) * (Math.PI / 180);
    const radius = 25 + ((seed * 7) % 55);
    dots.push({
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      delay: (i * 0.3) % 2,
    });
  }
  return dots;
}

export default function RadarDisplay({ totalRiders, activeRides, meetups }) {
  const onlineUsers = activeRides + meetups;
  const dots = generateDots(totalRiders);

  return (
    <div className="mx-5 mb-3 bg-secondary/40 border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-0 divide-x divide-border">
        {/* Radar Visual */}
        <div className="flex-shrink-0 w-[140px] h-[140px] relative flex items-center justify-center">
          {/* Concentric circles */}
          <div className="absolute w-[120px] h-[120px] rounded-full border border-primary/10" />
          <div className="absolute w-[80px] h-[80px] rounded-full border border-primary/15" />
          <div className="absolute w-[40px] h-[40px] rounded-full border border-primary/20" />

          {/* Radar sweep */}
          <div
            className="absolute w-[120px] h-[120px] rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 75%, hsl(120 100% 47% / 0.25) 100%)",
              animation: "radar-sweep 2.5s linear infinite",
            }}
          />

          {/* Center dot */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,240,50,0.8)] z-10" />

          {/* Rider dots */}
          {dots.map((dot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0.6], scale: [0, 1.2, 1, 1] }}
              transition={{ delay: dot.delay, duration: 0.4, repeat: Infinity, repeatDelay: 2.5 }}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/80"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 4px rgba(0,240,50,0.7)",
              }}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex-1 flex flex-col divide-y divide-border">
          {/* Nearby Riders */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{totalRiders}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Riders Nearby</p>
            </div>
          </div>

          {/* Online Now */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
              <Radio className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xl font-bold leading-none">{onlineUsers}</p>
                {onlineUsers > 0 && (
                  <span className="relative flex h-1.5 w-1.5 mt-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Online Now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}