/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone output bundles server + deps for Docker / bare-metal deploys.
  // For Vercel, comment this out — Vercel handles bundling automatically.
  // output: "standalone",

  // Suppress build warnings from legacy CSS-in-JS libs (if any)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Redirect legacy /disciplinary → /discipline (URL changed in new arch)
  async redirects() {
    return [
      { source: "/disciplinary", destination: "/discipline", permanent: true },
      { source: "/portal",       destination: "/student-portal", permanent: false },
      { source: "/admin/audit",  destination: "/audit-logs", permanent: true },
      { source: "/admin/users",  destination: "/user-role",  permanent: true },
      { source: "/admin/blocked-ips", destination: "/user-role", permanent: true },
      { source: "/fees/payments", destination: "/fees/receipt", permanent: true },
    ];
  },
};

export default nextConfig;
