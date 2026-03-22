import React from "react";
import { Link } from "react-router-dom";
import { User, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function HomeHeader({ username }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">RideRadar</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Group rides near you</p>
        </div>
      </div>
      <Link
        to="/profile"
        className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
      >
        <User className="w-4 h-4 text-foreground" />
      </Link>
    </div>
  );
}