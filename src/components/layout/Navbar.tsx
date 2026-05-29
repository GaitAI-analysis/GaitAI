"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { navLinks } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * Flat-tab Navbar.
 *
 * Five top-level tabs — MobilityCare, SecureVision, Use Cases, About,
 * Publications — plus the Logo, theme toggle and Request Demo CTA.
 * The active route gets a subtle highlight so wayfinding is obvious.
 * Mobile collapses to the same flat list inside an animated drawer.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer when the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "py-3" : "py-5"
        )}
      >
        <div className="container-wide">
          <div
            className={cn(
              "relative flex items-center justify-between rounded-full transition-all duration-500",
              scrolled
                ? "glass px-4 py-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
                : "px-1 py-1"
            )}
          >
            <Link href="/" aria-label="GaitAI" className="flex items-center pl-2">
              <Logo variant="wordmark" size="md" priority />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "group relative px-3.5 py-2 text-sm transition-colors duration-300",
                      active
                        ? "text-soft-white"
                        : "text-soft-gray hover:text-soft-white"
                    )}
                  >
                    {link.label}
                    {/* Gradient underline — scales in from center on hover,
                        stays visible on the active route. */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-x-3.5 -bottom-0.5 h-[2px] origin-center rounded-full bg-gradient-to-r from-cyan-300 via-royal-400 to-violet-400 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        active
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                      )}
                      style={{
                        boxShadow:
                          "0 0 14px rgba(79,209,255,0.55), 0 0 28px rgba(124,58,237,0.35)",
                      }}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/#contact"
                className="hidden items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-soft-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 sm:inline-flex"
              >
                Request demo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="grid h-9 w-9 place-items-center rounded-full glass lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-obsidian/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container-wide flex items-center justify-between py-5">
              <Logo variant="wordmark" size="md" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full glass"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="container-wide mt-12 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block border-b border-white/5 py-5 font-display text-3xl",
                      isActive(link.href)
                        ? "text-soft-white"
                        : "text-soft-gray"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.a
                href="/#contact"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="btn-primary mt-8 self-start"
              >
                Request demo
                <ArrowUpRight className="h-4 w-4" />
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
