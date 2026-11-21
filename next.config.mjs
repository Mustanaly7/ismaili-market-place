/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg", "ioredis"],
  images: {
    // Demo catalogue images are remote placeholders (picsum.photos) that the
    // server-side optimizer cannot always reach, causing "upstream image
    // response timed out" errors. Load them directly in the browser instead.
    // Remove this once product images are served from local /uploads or a CDN.
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;