/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevents clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevents MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Controls referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Enables HSTS (HTTP Strict Transport Security)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevents XSS attacks
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Controls DNS prefetching
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Permissions Policy (restricts browser features)
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.razorpay.com https://*.rzp.io https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://*.razorpay.com",
              "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com https://*.razorpay.com https://*.rzp.io",
              "font-src 'self' https://fonts.gstatic.com https://*.razorpay.com",
              "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://*.razorpay.com https://*.rzp.io https://lumberjack.razorpay.com https://www.google-analytics.com wss://*.supabase.co",
              "frame-src 'self' https://*.razorpay.com https://*.rzp.io",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.razorpay.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  // Disable x-powered-by header (info leak)
  poweredByHeader: false,

  // Enable React strict mode for catching issues
  reactStrictMode: true,

  // Compress responses
  compress: true,
};

export default nextConfig;
