# Working on gaitai.in

## Visual design: one website

Every new page, section or feature must look like the existing homepage and product pages. Do not give it its own palette, typeface or theme. Read `docs/design-system.md` before writing any CSS:

- Use the global classes: `.btn-primary`, `.btn-ghost`, `.card`, `.eyebrow`, `.pill`, `.container-wide`, `.section`, `<SectionHeading>`.
- In CSS modules, take every colour, font, radius and shadow from the `--ui-*` tokens in `src/app/design-system.css`. Compose global classes with `composes: btn-primary from global;`.
- Fonts are Inter (body), Space Grotesk (headings) and JetBrains Mono (technical), loaded once in `src/app/layout.tsx`. Never add a `next/font` import elsewhere.
- Dark is the default branch and light is `:root.light`. Never theme with `:global(.dark)`.
- Don't write hex or `rgb()` literals in modules. Don't add new gradients, and never use electric blue.

`npm run check:design-system` (part of `npm run verify` and every deploy) enforces this. Never raise `scripts/design-system-baseline.json` to make it pass.
