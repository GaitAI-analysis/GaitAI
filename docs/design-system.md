# The GaitAI design system: one website, not a set of pages

The source of truth is the site as it already looks: the homepage, `/mobilitycare`, `/securevision`, the Blog and the navigation. A new page, section or feature has to look like those pages. It does not get a look of its own.

## Why this file exists

Up to 2026-10-14, every page added after the core site brought its own visual identity:

- the GaitAI Care page, its launch announcement and its download page;
- the MobilityCare and SecureVision Android download pages;
- `/account`;
- the "Explore the app" showcases.

They used a warm paper ground (`#f6f4ef`), a separate navy (`#17243a`), a gold accent (`#886322`) and the Georama typeface. They were light-first and flipped on `.dark`. Each new page copied the previous one's private palette (`--care-*`, then `--app-*`), so the drift grew with every release.

These pages now use the site's tokens and classes. `npm run check:design-system` runs in `npm run verify`, and so in every deploy. It fails the build when a stylesheet brings its own palette back.

## The layers

| Layer | File | Owns |
|---|---|---|
| Dark branch (default) | `src/app/globals.css` `:root` | every colour token, at the approved dark values |
| Light branch | `src/app/globals.css` + `src/app/light-theme.css` `:root.light` | the same tokens, re-pointed for paper |
| Interaction | `src/app/globals.css` (`--interactive-*`), `src/app/interactions.css` | hover, selected, focus, card hit-states |
| Phones | `src/app/mobile.css` | section rhythm, gutters, eyebrow tracking below 640px / 1024px |
| **Shared UI tokens** | **`src/app/design-system.css`** | **`--ui-*`: aliases of the above for module CSS. No new colours.** |

Fonts come from `src/app/layout.tsx` only:

- **Inter** for body text (`--ui-font-body`);
- **Space Grotesk** for headings, at the Tailwind display scale (`--ui-font-display`);
- **JetBrains Mono** for checksums, code and technical text (`--ui-font-mono`).

## Building a new page or section

1. **Use the global classes first.**

   | What | Class |
   |---|---|
   | Buttons | `.btn-primary` / `.btn-ghost` |
   | Cards | `.card` (or `.card-surface` / `.card-link` when the whole card is clickable) |
   | Labels | `.eyebrow` |
   | Chips | `.pill` |
   | Section headings | `<SectionHeading>` |
   | Page width | `.container-wide` |
   | Vertical rhythm | `.section` |
   | Headline accent | `text-gradient` (MobilityCare, general), `text-gradient-secure` (SecureVision) |

2. **In a CSS module, compose those classes rather than restyling them:**

   ```css
   .primary { composes: btn-primary from global; }
   .panel   { composes: card from global; padding: 32px; }
   .label   { composes: eyebrow from global; }
   ```

   `composes` only works on a selector that is a single class, such as `.x`. It does not work on a descendant selector such as `.a .b`.

3. **Take every other value from `--ui-*`:**

   | Token | Use |
   |---|---|
   | `--ui-ink`, `--ui-body`, `--ui-muted` | headings, body copy, metadata |
   | `--ui-label` | eyebrows, step numbers (the `.eyebrow` colour) |
   | `--ui-accent` | the active or current item. Set it to `var(--mobility-accent)` or `var(--secure-accent)` on a product subtree, and add `ix-family-care` / `ix-family-secure` |
   | `--ui-surface`, `--ui-surface-solid`, `--ui-surface-sunken` | card gradient, solid card, inset band or code well |
   | `--ui-line`, `--ui-line-strong` | hairlines |
   | `--ui-hover-bg`, `--ui-hover-line`, `--ui-selected-bg`, `--ui-selected-line`, `--ui-focus` | states |
   | `--ui-radius-card` (16px), `--ui-radius-inset` (12px), `--ui-radius-control` (pill) | shape |
   | `--ui-container`, `--ui-gutter`, `--ui-section-y` | width and rhythm. Phones follow mobile.css automatically |
   | `--ui-brand-gold` | the logo's gold, for a product wordmark only |

4. **Theme.** Write the default (dark) rule only. If light genuinely needs a different value, add a token to the `:root.light` block of `design-system.css`; never put it in the module. Never write `:global(.dark)`.

5. **Don't:**
   - write a hex, `rgb()` or `hsl()` literal, or `white` / `black`, in a module;
   - declare a palette of your own (`--mypage-bg: …`);
   - import a font with `next/font`;
   - set a `font-family` other than `var(--ui-font-*)` or `inherit`;
   - add a gradient that the global classes don't already have;
   - use electric blue.

## The guard

`node scripts/check-design-system.mjs` scans every stylesheet under `src/` except the five token owners listed above.

- **Colours:** hex, `rgb()`/`hsl()`/`oklch()` literals, `white`/`black`.
- **Fonts:** `font-family` values other than the tokens.
- **Theme flips:** `:global(.dark)`.
- **Font imports:** it also scans every `.ts`/`.tsx` file for `next/font` imports outside `layout.tsx`.

How the baseline works:

- Stylesheets that predate the guard (the approved hero, Blog figures, Labs, research visuals) are listed in `scripts/design-system-baseline.json` at their 2026-10-14 counts.
- A file **not** in the baseline must be clean.
- A file in the baseline may go down, never up. After cleaning one, run `--lower` to ratchet the baseline down.
- **Never add a file to the baseline or raise a number to make the check pass.**
- `--report` prints every file's counts.

## Verifying a visual change

Compare the new page against the homepage and the product pages, in both themes, at 1440×900 and 390×844. A new page should be impossible to tell apart, in ground, type, buttons and cards, from `/mobilitycare`.
