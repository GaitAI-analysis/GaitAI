"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { navGroups } from "@/data/content";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const onHomeHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const mobileTrigger = mobileTriggerRef.current;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => mobileCloseRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      mobileTrigger?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setActiveMenu(null);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setActiveMenu(null);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const groupIsActive = (group: (typeof navGroups)[number]) =>
    group.items.some((item) => {
      const route = item.href.split("#")[0];
      if (route === "/") return pathname === "/" && group.label === "Platform";
      return pathname?.startsWith(route);
    });

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "py-3" : "py-5")}
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
            <Link href="/" aria-label="GaitAI home" className="flex items-center pl-2">
              <Logo variant="wordmark" size="md" priority tone={onHomeHero ? "on-dark" : "auto"} />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {navGroups.map((group) => {
                const open = activeMenu === group.label;
                const active = groupIsActive(group);
                return (
                  <div
                    key={group.label}
                    className="relative"
                    onMouseEnter={() => setActiveMenu(group.label)}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={open}
                      aria-controls={`nav-${group.label.toLowerCase()}-panel`}
                      onClick={() => setActiveMenu(open ? null : group.label)}
                      onFocus={() => setActiveMenu(group.label)}
                      className={cn(
                        "group inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
                        onHomeHero
                          ? "text-slate-300 hover:text-white"
                          : active || open
                            ? "text-soft-white"
                            : "text-soft-gray hover:text-soft-white"
                      )}
                    >
                      {group.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {open && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          id={`nav-${group.label.toLowerCase()}-panel`}
                          className="absolute left-1/2 top-full mt-2 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-obsidian-200/95 p-2 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
                        >
                          <div className="px-3 pb-2 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-soft-mute">
                            {group.label}
                          </div>
                          {group.items.map((item) => (
                            <Link
                              key={`${group.label}-${item.href}-${item.label}`}
                              href={item.href}
                              onClick={() => setActiveMenu(null)}
                              className="group/item flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                            >
                              <span>
                                <span className="block text-sm font-medium text-soft-white">{item.label}</span>
                                <span className="mt-0.5 block text-[11px] text-soft-mute">{item.description}</span>
                              </span>
                              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-soft-mute transition-transform group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 group-hover/item:text-cyan-300" />
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="mailto:hello@gaitai.com?subject=GaitAI%20demo%20enquiry"
                className={cn(
                  "hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all sm:inline-flex",
                  onHomeHero
                    ? "bg-white/5 text-white ring-white/15 hover:bg-white/10"
                    : "bg-white/5 text-soft-white ring-white/10 hover:bg-white/10 hover:ring-white/20"
                )}
              >
                Request demo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <button
                ref={mobileTriggerRef}
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                className="grid h-10 w-10 place-items-center rounded-full glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-obsidian/98 backdrop-blur-xl lg:hidden"
          >
            <div className="container-wide flex items-center justify-between py-5">
              <Logo variant="wordmark" size="md" />
              <button
                ref={mobileCloseRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="grid h-10 w-10 place-items-center rounded-full glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="container-wide pb-12 pt-6" aria-label="Mobile navigation">
              <div className="grid gap-8 sm:grid-cols-2">
                {navGroups.map((group, groupIndex) => (
                  <motion.section
                    key={group.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.05, duration: 0.35 }}
                  >
                    <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">{group.label}</h2>
                    <div className="mt-3 border-t border-white/10">
                      {group.items.map((item) => (
                        <Link
                          key={`${group.label}-mobile-${item.href}-${item.label}`}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between border-b border-white/[0.07] py-3.5 font-display text-xl text-soft-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                        >
                          {item.label}
                          <ArrowUpRight className="h-4 w-4 text-soft-mute" />
                        </Link>
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
              <a
                href="mailto:hello@gaitai.com?subject=GaitAI%20demo%20enquiry"
                onClick={() => setMobileOpen(false)}
                className="btn-primary mt-10 w-full sm:w-auto"
              >
                Request demo
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
