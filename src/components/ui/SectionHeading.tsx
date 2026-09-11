"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  /**
   * Which step of the display scale the heading takes.
   *
   * "xl" is the site-wide default and every existing caller keeps it. "lg" is
   * for the home page, where eight sections each spend a full display-xl on a
   * heading and the visitor is meant to be moving between them rather than
   * arriving at each one — one step down the SAME scale, not a different
   * typeface, weight or tracking.
   */
  size?: "xl" | "lg";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  size = "xl",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-5",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="eyebrow"
        >
          <span className="h-1 w-6 rounded-full bg-gradient-brand" />
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className={cn(
          "font-display text-balance text-soft-white",
          size === "lg" ? "text-display-lg" : "text-display-xl",
        )}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="max-w-2xl text-balance text-base leading-relaxed text-soft-gray sm:text-lg"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
