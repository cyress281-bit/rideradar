import React from "react";
import { Link } from "react-router-dom";
import { User, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function HomeHeader({ username, user }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <img
            src="https://media.base44.com/images/public/69c00371996a3698d9301734/b98c6b34e_generated_image.png"
            alt="RideRadar logo"
            className="w-9 h-9 rounded-xl object-cover shadow-[0_0_14px_rgba(0,240,50,0.6)]"
          />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background shadow-[0_0_6px_rgba(0,240,50,0.8)]" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">RideRadar</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Never ride alone</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
      </div>
    </div>
  );
}