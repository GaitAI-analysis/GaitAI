"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Search,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { AtlasTrigger } from "@/components/atlas/AtlasTrigger";
import { SEARCH_EVENT } from "@/components/search/IntelligenceSearch";
import { navLinks, type NavItem } from "@/data/content";
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
  const desktopNav = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();

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

  /* A desktop dropdown closes on every signal that the visitor has moved on,
     not only the pointer leaving its box. The wrapper's own handlers cover
     hover-out and focus-out; these cover what they cannot see:

       pointerdown outside the nav  — a click on the hero, the theme toggle,
                                      the search trigger, anywhere.
       Escape, anywhere              — the wrapper's onKeyDown only hears it
                                      while focus is INSIDE the menu; a
                                      pointer-opened menu has no focus there.
       the window losing focus       — alt-tab with a menu down.

     Listeners are attached only while a menu is open, so a closed header
     costs nothing. Belt and braces: the panel is unmounted when closed, so
     nothing here is what hides it — it is what makes sure it is closed. */
  useEffect(() => {
    if (openMenu === null) return;
    const close = () => setOpenMenu(null);
    const onPointerDown = (event: PointerEvent) => {
      const nav = desktopNav.current;
      if (
        !nav ||
        !(event.target instanceof Node) ||
        !nav.contains(event.target)
      )
        close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", close);
    };
  }, [openMenu]);

  /* A theme change repaints every surface under the menu; a panel left open
     across it would be the one thing that did not repaint with the page. The
     toggle is outside the nav, so pointerdown above already closes it — this
     also covers System following the OS, where no click happens. */
  useEffect(() => {
    setOpenMenu(null);
  }, [resolvedTheme]);

  /**
   * Does this route sit under `href`?
   *
   * Prefix matching, which is what a TOP-LEVEL item wants: "Research & IP"
   * should stay lit on /research/talks/ because Talks belongs to that family.
   */
  const isUnder = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  /**
   * How strongly this submenu entry claims the current route, or -1 for not
   * at all. The winner is simply the highest score among its siblings, so
   * EXACTLY ONE row can ever be lit.
   *
   * The score is the length of the longest route prefix the entry owns that
   * the current path sits under. Length is the tie-breaker because a longer
   * prefix is a more specific claim — on /research/talks/ both "Research"
   * (/research) and "Talks & Presentations" (/research/talks) match, and the
   * second is the answer. Before this was length-ranked the dropdown lit both
   * and neither looked like where you were.
   *
   * Two things the plain prefix rule could not express, both from the blog:
   *
   *   `exact`  · "Latest Stories" lives at /insights, which prefixes every
   *              article in the publication. Only an exact match counts for
   *              it, so reading an article lights the Blog tab and no row
   *              rather than claiming you are on the feed.
   *   `owns`   · topic pages are at /insights/topic/<slug>/, which is not
   *              under the /insights/topics/ directory that lists them. The
   *              row names the prefix it owns instead.
   *
   * The three older menus declare neither and behave exactly as before:
   *
   *   /research/              Research
   *   /research/talks/        Talks & Presentations   (not Research)
   *   /publications/<paper>/  Publications
   */
  const claimScore = (item: NavItem) => {
    const scores = [
      item.exact
        ? pathname === item.href
          ? item.href.length
          : -1
        : isUnder(item.href)
          ? item.href.length
          : -1,
      ...(item.owns ?? []).map((prefix) =>
        isUnder(prefix) ? prefix.length : -1,
      ),
    ];
    return Math.max(...scores);
  };

  const childIsActive = (child: NavItem, siblings: readonly NavItem[]) => {
    const score = claimScore(child);
    if (score < 0) return false;
    return !siblings.some(
      (other) => other !== child && claimScore(other) > score,
    );
  };

  const itemIsActive = (item: (typeof navLinks)[number]) =>
    isUnder(item.href) || item.children?.some((child) => isUnder(child.href));

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={cn(
          "site-header fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "py-3" : "py-5",
        )}
      >
        <div className="container-wide">
          <div
            className={cn(
              "relative flex items-center justify-between rounded-full transition-all duration-500",
              scrolled
                ? "glass px-4 py-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
                : "px-1 py-1",
            )}
          >
            <Link
              href="/"
              aria-label="GaitAI"
              className="flex items-center pl-2"
            >
              <Logo variant="wordmark" size="md" priority />
            </Link>

            {/* THE DESKTOP NAV APPEARS AT 1040, NOT 1280. It was `xl:flex`,
                which put every laptop between 1024 and 1279 behind the
                hamburger — a 1280 window with a scrollbar included — even
                though the row fits there with room to spare. `navbar` is a
                measured breakpoint, not a guess: see tailwind.config.ts. The
                hamburger keeps everything below it, which is tablet portrait
                and landscape (1024) and every phone. */}
            <nav
              ref={desktopNav}
              className="hidden items-center gap-0 navbar:flex 2xl:gap-1"
            >
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
                        if (
                          !event.currentTarget.contains(event.relatedTarget)
                        ) {
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
                        aria-current={isUnder(link.href) ? "page" : undefined}
                        className={cn(
                          "group/link relative flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-sm outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-cyan-300/60 2xl:px-3.5",
                          active || menuOpen
                            ? "text-soft-white"
                            : "text-soft-gray hover:text-soft-white",
                        )}
                      >
                        {link.label}
                        {/* The chevron is the dropdown's whole resting
                            affordance, so it also has to say when the menu is
                            OPEN — it flips, and takes the accent with it. */}
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            "h-3.5 w-3.5 transition-[transform,color] duration-300",
                            menuOpen && "rotate-180 text-cyan-300",
                          )}
                        />
                        {/* Open is a state, not just a hover: the underline
                            stays put while the panel is down, so the trigger
                            the panel belongs to is never ambiguous. */}
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute inset-x-2.5 -bottom-0.5 h-px origin-center rounded-full bg-gradient-to-r from-cyan-300/80 via-royal-400/80 to-violet-400/80 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] 2xl:inset-x-3.5",
                            active || menuOpen
                              ? "scale-x-100 opacity-100"
                              : "scale-x-0 opacity-0 group-hover/link:scale-x-100 group-hover/link:opacity-100",
                          )}
                          style={{
                            boxShadow: "0 0 8px rgba(79,209,255,0.3)",
                          }}
                        />
                      </Link>

                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            data-nav-menu={link.href}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              pointerEvents: "auto",
                            }}
                            /* `pointerEvents: none` is set the instant the exit
                               starts: a panel fading out must not catch the
                               pointer and reopen itself, and must never be the
                               thing under a click meant for the hero. */
                            exit={{ opacity: 0, y: 4, pointerEvents: "none" }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-1/2 top-full z-20 w-72 -translate-x-1/2 pt-2"
                          >
                            {/* An OPAQUE surface, and no backdrop-filter. The
                                panel used to blur what was behind it; a
                                blurred, translucent layer animating out over a
                                bright photograph is exactly the kind of layer a
                                compositor can leave a ghost of, and in the
                                light theme the surface is white on white, so
                                the blur bought nothing anyone could see. The
                                panel is its own stacking context (`isolate`),
                                so nothing inside it can paint above the header
                                chrome. */}
                            <div className="isolate overflow-hidden rounded-2xl border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] p-2 shadow-[var(--shadow-dropdown)]">
                              {link.children.map((child) => {
                                const childActive = childIsActive(
                                  child,
                                  link.children ?? [],
                                );
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    aria-current={
                                      childActive ? "page" : undefined
                                    }
                                    className={cn(
                                      "menu-card px-3 py-2 text-sm",
                                      childActive
                                        ? "menu-card-on text-cyan-300"
                                        : "text-soft-gray hover:text-soft-white",
                                    )}
                                  >
                                    <span className="min-w-0">
                                      {child.label}
                                      {/* Purpose line — a label like
                                          "GaitScape" means nothing on a first
                                          visit. It brightens with the title:
                                          see .menu-card-sub. */}
                                      {child.description && (
                                        <span
                                          className={cn(
                                            "menu-card-sub mt-0.5 block text-[11px] leading-snug",
                                            childActive
                                              ? "text-soft-gray"
                                              : "text-soft-mute",
                                          )}
                                        >
                                          {child.description}
                                        </span>
                                      )}
                                    </span>
                                    {/* The panel's only motion: a chevron
                                        arriving from the left on the row the
                                        pointer is over, so a menu item is
                                        never mistaken for a heading. */}
                                    <ChevronRight
                                      aria-hidden="true"
                                      className="menu-card-arrow h-3.5 w-3.5"
                                    />
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
                      "group relative whitespace-nowrap rounded-full px-2.5 py-2 text-sm outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-cyan-300/60 2xl:px-3.5",
                      isHome && "flex items-center",
                      active
                        ? "text-soft-white"
                        : "text-soft-gray hover:text-soft-white",
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
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
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
              {/* The Atlas, one glyph wide. See AtlasTrigger for why this is
                  not a seventh nav tab. */}
              <AtlasTrigger />
              <ThemeToggle />
              <Link
                href="/#contact"
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-soft-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 sm:inline-flex"
              >
                Request demo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              {/* The one control that has to be reachable one-handed: 36px on
                  a mouse, 44px where there is a thumb. */}
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-expanded={open}
                className="ix-hit-box grid h-9 w-9 place-items-center rounded-full glass transition-colors hover:border-white/20 active:scale-95 navbar:hidden"
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
            className="fixed inset-0 z-[60] overflow-y-auto bg-obsidian/95 backdrop-blur-xl navbar:hidden"
          >
            <div className="container-wide flex items-center justify-between py-5">
              <Logo variant="wordmark" size="md" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="ix-hit-box grid h-9 w-9 place-items-center rounded-full glass transition-colors hover:border-white/20 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="container-wide mt-10 flex flex-col gap-1 pb-16">
              {/* The palette was desktop-only: the navbar trigger is hidden
                  below md because a ⌘K key cap means nothing on a phone, and
                  the drawer offered no other way in — so search simply did not
                  exist on mobile. Here it is a real row, worded as an action,
                  with no shortcut to misrepresent. */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent(SEARCH_EVENT));
                }}
                className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left text-[15px] text-soft-gray transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-soft-white active:scale-[0.99]"
              >
                <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
                Search products, research and stories
              </button>

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
                      aria-current={isUnder(link.href) ? "page" : undefined}
                      className={cn(
                        "block py-5 font-display text-3xl",
                        !link.children && "border-b border-white/5",
                        active ? "text-soft-white" : "text-soft-gray",
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
                          const childActive = childIsActive(
                            child,
                            link.children ?? [],
                          );
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "menu-card px-3 py-2.5 text-lg",
                                childActive
                                  ? "menu-card-on text-cyan-300"
                                  : "text-soft-mute hover:text-soft-white",
                              )}
                            >
                              <span className="min-w-0">
                                {child.label}
                                {child.description && (
                                  <span className="menu-card-sub mt-0.5 block text-[12px] leading-snug text-soft-mute">
                                    {child.description}
                                  </span>
                                )}
                              </span>
                              {/* On a phone there is no hover to reveal it,
                                  so the chevron is simply present — see the
                                  `(hover: none)` block in interactions.css. */}
                              <ChevronRight
                                aria-hidden="true"
                                className="menu-card-arrow h-4 w-4"
                              />
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
