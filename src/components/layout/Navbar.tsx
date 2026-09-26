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
  Map as MapIcon,
  Menu,
  Monitor,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { AtlasTrigger } from "@/components/atlas/AtlasTrigger";
import { openAtlas } from "@/components/atlas/atlas-event";
import { SEARCH_EVENT } from "@/components/search/IntelligenceSearch";
import { ASK_EVENT } from "@/components/assistant/config";
import { navLinks, type NavItem } from "@/data/content";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/paths";

/** Whether `pathname` sits under `href` (the menu sheet's opening family). */
function isUnderPath(pathname: string | null, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || !!pathname?.startsWith(`${href}/`);
}

const THEME_CHOICES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/**
 * The theme, as three named choices at the foot of the menu sheet. The
 * header's one-button cycle (ThemeToggle) suits a mouse beside it; on a
 * phone, where the control lives in the sheet, a segmented choice says what
 * each option is and which one is on without cycling through all three.
 */
function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div role="group" aria-label="Theme" className="mnav__theme">
      {THEME_CHOICES.map(({ value, label, icon: Icon }) => {
        const on = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            data-on={on ? "true" : undefined}
            onClick={() => setTheme(value)}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

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
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  /* The menu sheet's open family: the one the current route is in. */
  const [section, setSection] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* The sheet opens on the family you are in, holds the page still behind
     it, takes focus to its close button and hands it back to the menu
     button when it closes. */
  useEffect(() => {
    if (!open) return;
    const here = navLinks.find(
      (link) =>
        link.children &&
        (isUnderPath(pathname, link.href) ||
          link.children.some((child) => isUnderPath(pathname, child.href))),
    );
    setSection(here ? here.href : null);
    const body = document.body;
    const before = body.style.overflow;
    body.style.overflow = "hidden";
    const focus = window.requestAnimationFrame(() =>
      closeButton.current?.focus(),
    );
    const trigger = menuButton.current;
    return () => {
      body.style.overflow = before;
      window.cancelAnimationFrame(focus);
      /* Only when focus was in the sheet (Escape, the close button): a link
         that navigated away takes focus with it to the new page. */
      const active = document.activeElement;
      if (!active || active === document.body || active.closest(".mnav")) {
        trigger?.focus({ preventScroll: true });
      }
    };
  }, [open, pathname]);

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
          /* Phones and tablets: one compact bar at every scroll position
             (see "THE MOBILE HEADER" in mobile.css); the floating pill is
             the desktop's. */
          scrolled ? "is-scrolled py-2.5 lg:py-3" : "py-2.5 lg:py-5",
        )}
      >
        <div className="container-wide">
          <div
            className={cn(
              "site-header__bar relative flex items-center justify-between rounded-full transition-all duration-500",
              scrolled
                ? "glass px-4 py-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
                : "px-1 py-1",
            )}
          >
            <Link
              href="/"
              aria-label="GaitAI"
              className="site-header__logo flex items-center pl-2"
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
              {/* Search, the Atlas and the theme are desktop controls in the
                  bar. On phones and tablets (below 1024px) all three live in
                  the menu sheet instead, so a phone's header holds only the logo,
                  Request demo and the menu — `contents` leaves the desktop
                  row exactly as it was. */}
              <span className="hidden lg:contents">
                {/* Opens the Cmd/Ctrl + K palette. */}
                <SearchTrigger />
                {/* The Atlas, one glyph wide. See AtlasTrigger for why this
                    is not a seventh nav tab. */}
                <AtlasTrigger />
                <ThemeToggle />
              </span>
              <Link
                href="/#contact"
                className="site-header__demo inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/5 px-3.5 py-2 text-[13px] font-medium text-soft-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 sm:px-4 sm:text-sm"
              >
                Request demo
                <ArrowUpRight className="hidden h-3.5 w-3.5 sm:block" />
              </Link>
              {/* The one control that has to be reachable one-handed: 36px on
                  a mouse, 44px where there is a thumb. */}
              <button
                ref={menuButton}
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-expanded={open}
                className="site-header__menu grid h-11 w-11 place-items-center lg:h-9 lg:w-9 rounded-full glass transition-colors hover:border-white/20 active:scale-95 navbar:hidden"
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* THE MENU SHEET (below the navbar breakpoint). A full-height sheet
          that slides in from the right: the search row, Home, then the four
          families as an accordion — one open at a time, the one you are in
          open on arrival — and, pinned to the foot where a thumb rests, the
          theme and Request demo. Escape, the close button, the scrim (on a
          tablet, where the sheet is narrower than the screen) and any route
          change close it. Styles: "THE MENU SHEET" in mobile.css. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="mnav fixed inset-0 z-[60] navbar:hidden"
          >
            <div
              aria-hidden="true"
              className="mnav__scrim"
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="mnav__panel"
              initial={{ x: 28, opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mnav__top">
                <Link
                  href="/"
                  aria-label="GaitAI home"
                  onClick={() => setOpen(false)}
                  className="flex items-center"
                >
                  <Logo variant="wordmark" size="md" />
                </Link>
                <button
                  type="button"
                  ref={closeButton}
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="mnav__close"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="mnav__scroll">
                {/* Search on a phone: a real row, worded as an action — the
                    header's ⌘K trigger means nothing without a keyboard. */}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(new CustomEvent(SEARCH_EVENT));
                  }}
                  className="mnav__search"
                >
                  <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
                  Search products, research and stories
                </button>

                <nav aria-label="Primary" className="mnav__list">
                  {navLinks.map((link) => {
                    const active = itemIsActive(link);
                    if (!link.children) {
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          aria-current={isUnder(link.href) ? "page" : undefined}
                          className="mnav__row"
                          data-active={active ? "true" : undefined}
                        >
                          {link.label}
                        </Link>
                      );
                    }
                    const expanded = section === link.href;
                    const panelId = `mnav-${link.href.replace(/\W+/g, "")}`;
                    return (
                      <div
                        key={link.href}
                        className="mnav__group"
                        data-open={expanded ? "true" : undefined}
                      >
                        <button
                          type="button"
                          className="mnav__row"
                          data-active={active ? "true" : undefined}
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          onClick={() =>
                            setSection((current) =>
                              current === link.href ? null : link.href,
                            )
                          }
                        >
                          {link.label}
                          <ChevronDown
                            aria-hidden="true"
                            className="mnav__chevron"
                          />
                        </button>
                        <div
                          id={panelId}
                          className="mnav__sub"
                          /* A closed family is out of the tab order and
                             the accessibility tree while it folds. */
                          ref={(el) => {
                            if (el) el.inert = !expanded;
                          }}
                        >
                          <div className="mnav__subInner">
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
                                  aria-current={
                                    childActive ? "page" : undefined
                                  }
                                  className="mnav__item"
                                  data-active={childActive ? "true" : undefined}
                                >
                                  <span className="min-w-0">
                                    <span className="mnav__itemLabel">
                                      {child.label}
                                    </span>
                                    {child.description && (
                                      <span className="mnav__itemSub">
                                        {child.description}
                                      </span>
                                    )}
                                  </span>
                                  <ChevronRight
                                    aria-hidden="true"
                                    className="mnav__itemArrow"
                                  />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </nav>

                {/* Ask GaitAI as a row of its own. On a phone the floating
                    launcher steps aside while the page is being read (see
                    AskGaitAI), so the sheet is the place the assistant can
                    always be found. Opens the same panel by the same event
                    the search palette uses. */}
                <button
                  type="button"
                  className="mnav__atlas mnav__ask"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(new CustomEvent(ASK_EVENT));
                  }}
                >
                  <span aria-hidden="true" className="mnav__askMark">
                    ✦
                  </span>
                  <span>
                    <span className="mnav__itemLabel">Ask GaitAI</span>
                    <span className="mnav__itemSub">
                      Questions about products, research or deployment
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="mnav__atlas"
                  onClick={() => {
                    setOpen(false);
                    openAtlas();
                  }}
                >
                  <MapIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="mnav__itemLabel">GaitAI Atlas</span>
                    <span className="mnav__itemSub">The whole site as a map</span>
                  </span>
                </button>
              </div>

              <div className="mnav__foot">
                <ThemeChoice />
                <a
                  href={assetPath("/#contact")}
                  onClick={() => setOpen(false)}
                  className="mnav__demo"
                >
                  Request demo
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
