import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function CreateRideButton() {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
      <Link to="/create-ride">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary rounded-full blur-lg opacity-40" />
          <div className="relative w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}