import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  generatePageMetadata,
  getOrganizationSchema,
  getSoftwareApplicationSchema,
  getFAQSchema,
  getHowToSchema,
} from "./lib/seo";
import StructuredData from "./components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  ...generatePageMetadata({
    title: "GlowUp AI - Your Personal AI Appearance Coach",
    description:
      "Become 20% more attractive without surgery. AI builds a personalized 30-day glow-up roadmap with hair, skin, style & confidence recommendations tailored to your unique features.",
    path: "",
  }),
  keywords: [
    "glow up",
    "glow up AI",
    "AI appearance coach",
    "personal styling AI",
    "beauty AI",
    "self improvement",
    "attractiveness improvement",
    "glow up plan",
    "face analysis AI",
    "hairstyle recommendation",
    "skincare routine AI",
    "30 day glow up",
    "look better AI",
    "personal image consultant",
    "AI makeover",
    "face shape hairstyle",
  ],
  verification: {
    google: "your-google-verification-code",
  },
  category: "technology",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <StructuredData
          schemas={[
            getOrganizationSchema(),
            getSoftwareApplicationSchema(),
            getFAQSchema(),
            getHowToSchema(),
          ]}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
