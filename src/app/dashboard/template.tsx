"use client";

import { motion, MotionConfig } from "framer-motion";

/**
 * Remounts on every dashboard section change (Next.js template convention),
 * animating the incoming section in. `reducedMotion="user"` disables the
 * movement for users who prefer reduced motion.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
