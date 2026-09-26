# Security headers

## Current state

The site is a static export deployed to **GitHub Pages** (`.github/workflows/deploy.yml`).
GitHub Pages serves a fixed set of response headers and provides no mechanism —
no config file, no `_headers`, no edge function — for adding custom ones.

So on the current host these are **not set, and cannot be set**:

| Header | Status on GitHub Pages |
|---|---|
| `Content-Security-Policy` | Not settable. A `<meta http-equiv>` CSP is possible but cannot express `frame-ancestors` and blocks nothing the site currently loads, so none is declared rather than a decorative one. |
| `Strict-Transport-Security` | Applied by GitHub for custom domains with "Enforce HTTPS" enabled. Verify that box is checked for `gaitai.in`. |
| `X-Content-Type-Options` | Not settable. |
| `Referrer-Policy` | **Set** via `<meta name="referrer">` in `src/app/layout.tsx` (`strict-origin-when-cross-origin`). |
| `Permissions-Policy` | Not settable. |
| `X-Frame-Options` / `frame-ancestors` | Not settable. |

What is genuinely enforced today is the data layer, which matters more for this
site than the headers do: `firestore.rules` and `storage.rules` are the real
authorization boundary — a verified-email admin allowlist, per-field validation
on every write, content-type and size limits on uploads, and no catch-all
allow. The UI is not the gate.

## If the site moves hosts

Cloudflare Pages and Netlify both read a `_headers` file from the publish
directory. Dropping this into `public/_headers` would apply on either:

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com; media-src 'self' https://firebasestorage.googleapis.com; font-src 'self' data:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://formspree.io; frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://formspree.io

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

`script-src` needs `'unsafe-inline'` because Next.js inlines its hydration
bootstrap and the JSON-LD blocks. Replacing it with a nonce requires a server
that can generate one per request, which a static export has no way to do — so
that is a hosting decision, not a code one.

The `connect-src` list is derived from what the app actually talks to:
Firestore/Auth/Storage (`src/lib/firebase.ts`), the Formspree endpoint used by
the demo form (`src/components/sections/CTA.tsx`), and Cloudflare Turnstile for
the comment widget. `frame-src` covers the embedded YouTube-nocookie and Vimeo
players in post media. **Verify this list against the code before applying it** —
an over-broad CSP is worse than none, and a too-narrow one breaks comments.

## Caching

The `_headers` block above also carries the caching policy the site wants and
GitHub Pages does not let it set: fingerprinted `/_next/static/*` immutable for
a year, versioned media likewise, HTML revalidated every time. GitHub Pages
currently serves everything with a short, uniform max-age, which is safe but
leaves repeat-visit performance on the table.
