export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://glowupai.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/analysis", "/results"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/analysis", "/results"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      {
        userAgent: "CCBot",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
