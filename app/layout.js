import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GlowUp AI - Your Personal AI Appearance Coach",
  description:
    "Become 20% more attractive without surgery. AI builds a personalized 30-day glow-up roadmap tailored to your unique features.",
  keywords: [
    "glow up",
    "AI appearance coach",
    "personal styling",
    "beauty AI",
    "self improvement",
    "attractiveness",
    "glow up plan",
  ],
  openGraph: {
    title: "GlowUp AI - Become the Best Version of Yourself",
    description:
      "AI-powered 30-day glow-up roadmap. Personalized hair, skin, style & confidence coaching.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
