import React from "react";
import { Users, Bike, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsBar({ totalRiders, activeRides, meetups }) {
  const stats = [
    { icon: Users, label: "Nearby (15mi)", value: totalRiders, color: "text-primary" },
    { icon: Bike, label: "Riding", value: activeRides, color: "text-green-400" },
    { icon: MapPin, label: "Meetups", value: meetups, color: "text-blue-400" },
  ];

  return (
    <div className="flex gap-3 px-5 py-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex-1 bg-secondary/60 rounded-xl p-3 flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div>
            <p className="text-base font-bold leading-none">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}