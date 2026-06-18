const isProduction = process.env.NODE_ENV === "production";
const basePath = isProduction ? "/GaitAI" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ["three"],
  basePath,
  assetPrefix: isProduction ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
