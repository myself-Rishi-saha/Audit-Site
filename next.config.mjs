/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.0.105", process.env.NEXT_PUBLIC_DEV_ORIGIN || "http://localhost:3000"],
}

export default nextConfig
