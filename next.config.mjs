process.env.WS_NO_BUFFER_UTIL = '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double mounting in dev for audio context & speech recognition
  experimental: {
    serverComponentsExternalPackages: ['msedge-tts', 'ws'],
  },
  typescript: {
    // The Express/PostgreSQL backend is hosted separately on Render.
    // Prevent backend controller types from failing the Vercel frontend build.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
