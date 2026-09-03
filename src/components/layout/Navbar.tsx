"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ChevronDown, Home, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { navLinks } from "@/data/content";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/paths";

/**
 * Shared desktop/mobile Navbar.
 *
 * Primary navigation tabs plus the Logo, theme toggle and Request Demo CTA.
 * The active route gets a subtle highlight so wayfinding is obvious.
 * Mobile preserves the same hierarchy inside an animated drawer.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the mobile drawer — it covers the whole viewport, so a
  // keyboard user needs a way out that isn't hunting for the close button.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close navigation overlays when the route changes. Client-side navigation
  // also leaves the clicked link focused, which browsers keep painting as a
  // focus rectangle on the now-active item — drop that stray focus; real
  // keyboard tabbing after load is unaffected.
  useEffect(() => {
    setOpen(false);
    setOpenMenu(null);
    const el = document.activeElement;
    if (el instanceof HTMLElement && el.closest("header")) el.blur();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const itemIsActive = (item: (typeof navLinks)[number]) =>
    isActive(item.href) || item.children?.some((child) => isActive(child.href));

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={cn(
          "site-header fixed inset-x-0 top-0 z-50 transition-all duration-500",
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

            <nav className="hidden items-center gap-0 xl:flex 2xl:gap-1">
              {navLinks.map((link) => {
                const active = itemIsActive(link);

                if (link.children) {
                  const menuOpen = openMenu === link.href;
                  return (
                    <div
                      key={link.href}
                      className="group relative"
                      onMouseEnter={() => setOpenMenu(link.href)}
                      onMouseLeave={() => setOpenMenu(null)}
                      onFocus={() => setOpenMenu(link.href)}
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          setOpenMenu(null);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setOpenMenu(null);
                      }}
                    >
                      <Link
                        href={link.href}
                        aria-haspopup="true"
                        aria-expanded={menuOpen}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className={cn(
                          "group/link relative flex items-center gap-1 rounded-full px-2.5 py-2 text-sm outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-cyan-300/60 2xl:px-3.5",
                          active
                            ? "text-soft-white"
                            : "text-soft-gray hover:text-soft-white"
                        )}
                      >
                        {link.label}
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-300",
                            menuOpen && "rotate-180"
                          )}
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute inset-x-2.5 -bottom-0.5 h-px origin-center rounded-full bg-gradient-to-r from-cyan-300/80 via-royal-400/80 to-violet-400/80 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] 2xl:inset-x-3.5",
                            active
                              ? "scale-x-100 opacity-100"
                              : "scale-x-0 opacity-0 group-hover/link:scale-x-100 group-hover/link:opacity-100"
                          )}
                          style={{
                            boxShadow: "0 0 8px rgba(79,209,255,0.3)",
                          }}
                        />
                      </Link>

                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            className="absolute left-1/2 top-full z-20 w-72 -translate-x-1/2 pt-2"
                          >
                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-obsidian-200/95 p-2 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                              {link.children.map((child) => {
                                const childActive = isActive(child.href);
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    aria-current={childActive ? "page" : undefined}
                                    className={cn(
                                      "block rounded-xl px-3 py-2 text-sm transition-colors",
                                      childActive
                                        ? "bg-white/[0.06] text-cyan-300"
                                        : "text-soft-gray hover:bg-white/[0.04] hover:text-soft-white"
                                    )}
                                  >
                                    {child.label}
                                    {/* Purpose line — a label like "GaitScape"
                                        means nothing on a first visit. */}
                                    {child.description && (
                                      <span className="mt-0.5 block text-[11px] leading-snug text-soft-mute">
                                        {child.description}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                const isHome = link.href === "/";

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-label={isHome ? "Home" : undefined}
                    title={isHome ? "Home" : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative rounded-full px-2.5 py-2 text-sm outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-cyan-300/60 2xl:px-3.5",
                      isHome && "flex items-center",
                      active
                        ? "text-soft-white"
                        : "text-soft-gray hover:text-soft-white"
                    )}
                  >
                    {isHome ? <Home className="h-4 w-4" /> : link.label}
                    {/* Gradient underline — scales in from center on hover,
                        stays visible on the active route. */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-x-2.5 -bottom-0.5 h-px origin-center rounded-full bg-gradient-to-r from-cyan-300/80 via-royal-400/80 to-violet-400/80 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] 2xl:inset-x-3.5",
                        active
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                      )}
                      style={{
                        boxShadow: "0 0 8px rgba(79,209,255,0.3)",
                      }}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Opens the Cmd/Ctrl + K palette. md and up only — the
                  shortcut has no meaning on a phone. */}
              <SearchTrigger />
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
                className="grid h-9 w-9 place-items-center rounded-full glass xl:hidden"
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
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed inset-0 z-[60] overflow-y-auto bg-obsidian/95 backdrop-blur-xl xl:hidden"
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
            <nav className="container-wide mt-10 flex flex-col gap-1 pb-16">
              {navLinks.map((link, i) => {
                const active = itemIsActive(link);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-label={link.href === "/" ? "Home" : undefined}
                      title={link.href === "/" ? "Home" : undefined}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={cn(
                        "block py-5 font-display text-3xl",
                        !link.children && "border-b border-white/5",
                        active ? "text-soft-white" : "text-soft-gray"
                      )}
                    >
                      {link.href === "/" ? (
                        <Home className="h-8 w-8" />
                      ) : (
                        link.label
                      )}
                    </Link>

                    {link.children && (
                      <div className="border-b border-white/5 pb-4 pl-4">
                        {link.children.map((child) => {
                          const childActive = isActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "block py-2.5 text-lg transition-colors",
                                childActive
                                  ? "text-cyan-300"
                                  : "text-soft-mute hover:text-soft-white"
                              )}
                            >
                              {child.label}
                              {child.description && (
                                <span className="mt-0.5 block text-[12px] leading-snug text-soft-mute">
                                  {child.description}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              <motion.a
                href={assetPath("/#contact")}
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
