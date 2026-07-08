// The site is served from the custom-domain ROOT (https://gaitai.in/), so there
// is no URL path prefix. Keep basePath empty in every environment. If the site
// is ever moved back under a subpath (e.g. /GaitAI), set it here once and every
// asset routed through assetPath() will pick it up automatically.
const basePath = "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a fully static site into `out/` so it can be hosted on GitHub Pages.
  //
  // Applied to production builds only. `next build` (NODE_ENV=production) still
  // exports to `out/` exactly as before, but `next dev` runs as a normal Next
  // server — otherwise `output: "export"` makes dynamic routes like
  // /publications/[slug] throw "missing generateStaticParams" in dev even though
  // they build fine. This keeps the production output identical and unblocks
  // local development with hot reload.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,

  // Add a trailing slash to every route. On static hosts this maps each page to
  // `route/index.html`, so deep links and refreshes (e.g. /about/) resolve
  // correctly instead of 404-ing.
  trailingSlash: true,

  reactStrictMode: true,
  transpilePackages: ["three"],

  basePath,

  images: {
    // GitHub Pages has no Next.js image-optimization server, so images must be
    // served as-is. Without this, every <Image> (logos, covers, founder photo)
    // fails to load on the static deployment.
    unoptimized: true,
  },

  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
