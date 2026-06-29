export default function manifest() {
  return {
    name: "GlowUp AI - Personal AI Appearance Coach",
    short_name: "GlowUp AI",
    description:
      "AI builds a personalized 30-day glow-up roadmap with hair, skin, style & confidence recommendations.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#a855f7",
    orientation: "portrait",
    categories: ["lifestyle", "health", "beauty"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
