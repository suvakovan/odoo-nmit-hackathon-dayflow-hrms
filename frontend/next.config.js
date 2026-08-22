/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["localhost"],
  },
  async redirects() {
    return [
      {
        source: "/login/dashboard/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
