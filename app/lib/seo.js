/**
 * SEO / Structured Data utilities for GlowUp AI
 * Generates JSON-LD schemas for search engines and AI answer engines
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://glowupai.com";
const APP_NAME = "GlowUp AI";
const APP_DESCRIPTION =
  "AI-powered personal appearance coach. Get a personalized 30-day glow-up roadmap with hair, skin, style & confidence recommendations.";

// ─── ORGANIZATION SCHEMA ──────────────────────────
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: APP_DESCRIPTION,
    sameAs: [
      "https://twitter.com/glowupai",
      "https://instagram.com/glowupai",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@glowupai.com",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

// ─── SOFTWARE APPLICATION SCHEMA ──────────────────
export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    description: APP_DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        name: "Free Analysis",
        description: "Upload selfie and see top 3 strengths",
      },
      {
        "@type": "Offer",
        price: "199",
        priceCurrency: "INR",
        name: "Glow-Up Report",
        description:
          "Full personalized analysis with hair, skin, beard, outfit recommendations",
      },
      {
        "@type": "Offer",
        price: "499",
        priceCurrency: "INR",
        name: "30-Day Coach",
        description:
          "Daily accountability, progress tracking, and AI comparison",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "2400",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

// ─── FAQ SCHEMA (AEO) ─────────────────────────────
export function getFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is GlowUp AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GlowUp AI is a personal AI appearance coach that analyzes your selfie and creates a personalized 30-day glow-up roadmap. It provides specific recommendations for hairstyle, skincare routine, beard style, outfit colors, and more — all based on your unique facial features.",
        },
      },
      {
        "@type": "Question",
        name: "How does GlowUp AI work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Upload a clear selfie, and our AI analyzes 50+ facial attributes including face shape, skin quality, proportions, and features. It then generates personalized recommendations for the highest-impact changes you can make, with a daily action plan and progress tracking.",
        },
      },
      {
        "@type": "Question",
        name: "Is GlowUp AI free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! The basic analysis is free — you can upload a selfie and see your top 3 strengths plus how many improvements were found. The full detailed report with actionable recommendations starts at ₹199 (one-time payment).",
        },
      },
      {
        "@type": "Question",
        name: "How much does GlowUp AI cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GlowUp AI offers three plans: Free (basic analysis), Glow-Up Report at ₹199 (full recommendations), 30-Day Coach at ₹499 (daily accountability and tracking), and Monthly Premium at ₹999/month (unlimited analyses and community features).",
        },
      },
      {
        "@type": "Question",
        name: "Is my selfie photo safe and private?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. Your photo is processed securely with 256-bit encryption and is never shared with third parties. Photos are automatically deleted from our servers after analysis is complete. We take privacy very seriously.",
        },
      },
      {
        "@type": "Question",
        name: "How accurate is the AI face analysis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our AI has been trained on thousands of facial features and styling outcomes. Rather than giving arbitrary scores, we focus on identifying specific, actionable improvements that have the highest impact on your appearance. Results vary by individual but most users report noticeable improvement within 2-4 weeks.",
        },
      },
      {
        "@type": "Question",
        name: "What makes GlowUp AI different from face rating apps?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Unlike face rating apps that just give you a score, GlowUp AI provides a complete transformation plan. We focus on actionable recommendations (specific haircuts, skincare routines, clothing colors) rather than judgmental ratings. Our 30-day challenge with daily checklists and weekly progress tracking helps you actually implement changes.",
        },
      },
      {
        "@type": "Question",
        name: "Can I get a refund if I'm not satisfied?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we offer a full 7-day money-back guarantee. If you're not satisfied with your glow-up report, simply email us and we'll process your refund immediately — no questions asked.",
        },
      },
    ],
  };
}

// ─── HOW-TO SCHEMA (AEO) ──────────────────────────
export function getHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Use GlowUp AI to Improve Your Appearance",
    description:
      "A step-by-step guide to using GlowUp AI for a personalized appearance transformation.",
    totalTime: "PT5M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: "199",
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Upload a Selfie",
        text: "Take or upload a clear, front-facing photo with good lighting. Remove sunglasses or hats for best results.",
        url: `${BASE_URL}/upload`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Enter Your Details",
        text: "Provide your age, gender, and primary goal (dating, confidence, professional, wedding, college, or social media).",
        url: `${BASE_URL}/upload`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Get AI Analysis",
        text: "Our AI analyzes 50+ facial features including face shape, skin quality, hair, proportions, and symmetry in under 30 seconds.",
        url: `${BASE_URL}/analysis`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Review Your Strengths",
        text: "See your top facial strengths for free — smile quality, hair density, eye shape, and more with confidence scores.",
        url: `${BASE_URL}/results`,
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Unlock Your Glow-Up Plan",
        text: "Get the full personalized report with haircut recommendations, skincare routine, beard style, color palette, and 30-day action plan.",
        url: `${BASE_URL}/premium`,
      },
    ],
  };
}

// ─── WEBPAGE SCHEMA ───────────────────────────────
export function getWebPageSchema(page = "home") {
  const pages = {
    home: {
      name: "GlowUp AI - Your Personal AI Appearance Coach",
      description: APP_DESCRIPTION,
      url: BASE_URL,
    },
    upload: {
      name: "Upload Selfie - GlowUp AI",
      description:
        "Upload your selfie to get a personalized AI appearance analysis and glow-up recommendations.",
      url: `${BASE_URL}/upload`,
    },
    premium: {
      name: "Premium Plans - GlowUp AI",
      description:
        "Unlock your full glow-up report with personalized hair, skin, style and confidence recommendations starting at ₹199.",
      url: `${BASE_URL}/premium`,
    },
  };

  const pageData = pages[page] || pages.home;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageData.name,
    description: pageData.description,
    url: pageData.url,
    isPartOf: {
      "@type": "WebSite",
      name: APP_NAME,
      url: BASE_URL,
    },
    provider: {
      "@type": "Organization",
      name: APP_NAME,
      url: BASE_URL,
    },
  };
}

// ─── BREADCRUMB SCHEMA ────────────────────────────
export function getBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? `${BASE_URL}${item.url}` : undefined,
    })),
  };
}

// ─── REVIEW / TESTIMONIAL SCHEMA ──────────────────
export function getReviewSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "GlowUp AI Glow-Up Report",
    description:
      "Personalized AI appearance analysis and 30-day transformation plan",
    brand: {
      "@type": "Brand",
      name: APP_NAME,
    },
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: { "@type": "Person", name: "Vikram S." },
        reviewBody:
          "The haircut recommendation alone was worth it. Got more compliments in one week than the entire last year.",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: { "@type": "Person", name: "Ananya R." },
        reviewBody:
          "The color palette section changed how I shop entirely. So much more confident now.",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: { "@type": "Person", name: "Rohan M." },
        reviewBody:
          "The 30-day plan kept me accountable. My skin cleared up and I finally figured out my beard.",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "2400",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

// ─── METADATA GENERATOR ───────────────────────────
export function generatePageMetadata({
  title,
  description,
  path = "",
  image = "/og-image.png",
  noIndex = false,
}) {
  const url = `${BASE_URL}${path}`;
  const fullTitle = title.includes(APP_NAME)
    ? title
    : `${title} | ${APP_NAME}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: APP_NAME,
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: "@glowupai",
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
    other: {
      "apple-mobile-web-app-title": APP_NAME,
      "application-name": APP_NAME,
    },
  };
}
