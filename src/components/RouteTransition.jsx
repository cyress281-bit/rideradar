import { motion } from "framer-motion";
import { useNavigationDirection } from "@/context/NavigationDirectionContext";

export default function RouteTransition({ children }) {
  const { getDirection } = useNavigationDirection();
  const direction = getDirection();

  // Push: slide in from right
  // Pop: slide out to right (exiting) / slide in from left (entering)
  const isPush = direction === "push";

  return (
    <motion.div
      initial={{ opacity: 0, x: isPush ? 30 : -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isPush ? -30 : 30 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}