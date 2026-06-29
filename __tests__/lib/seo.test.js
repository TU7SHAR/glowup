import {
  getOrganizationSchema,
  getSoftwareApplicationSchema,
  getFAQSchema,
  getHowToSchema,
  getWebPageSchema,
  getBreadcrumbSchema,
  getReviewSchema,
  generatePageMetadata,
} from "@/app/lib/seo";

describe("SEO Utilities", () => {
  // ─── ORGANIZATION SCHEMA ────────────────────────────
  describe("getOrganizationSchema", () => {
    it("should return valid Organization schema", () => {
      const schema = getOrganizationSchema();
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Organization");
      expect(schema.name).toBe("GlowUp AI");
      expect(schema.url).toBeDefined();
      expect(schema.contactPoint).toBeDefined();
    });
  });

  // ─── SOFTWARE APPLICATION SCHEMA ────────────────────
  describe("getSoftwareApplicationSchema", () => {
    it("should return valid SoftwareApplication schema", () => {
      const schema = getSoftwareApplicationSchema();
      expect(schema["@type"]).toBe("SoftwareApplication");
      expect(schema.applicationCategory).toBe("LifestyleApplication");
      expect(schema.offers).toHaveLength(3);
      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating.ratingValue).toBe("4.9");
    });

    it("should include all pricing tiers", () => {
      const schema = getSoftwareApplicationSchema();
      const prices = schema.offers.map((o) => o.price);
      expect(prices).toContain("0");
      expect(prices).toContain("199");
      expect(prices).toContain("499");
    });
  });

  // ─── FAQ SCHEMA ─────────────────────────────────────
  describe("getFAQSchema", () => {
    it("should return valid FAQPage schema", () => {
      const schema = getFAQSchema();
      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity).toBeDefined();
      expect(schema.mainEntity.length).toBeGreaterThan(0);
    });

    it("should have proper Question/Answer format", () => {
      const schema = getFAQSchema();
      schema.mainEntity.forEach((item) => {
        expect(item["@type"]).toBe("Question");
        expect(item.name).toBeTruthy();
        expect(item.acceptedAnswer["@type"]).toBe("Answer");
        expect(item.acceptedAnswer.text).toBeTruthy();
      });
    });

    it("should include key questions for AEO", () => {
      const schema = getFAQSchema();
      const questions = schema.mainEntity.map((q) => q.name);
      expect(questions).toContain("What is GlowUp AI?");
      expect(questions).toContain("How does GlowUp AI work?");
      expect(questions).toContain("Is GlowUp AI free?");
      expect(questions).toContain("How much does GlowUp AI cost?");
    });
  });

  // ─── HOW-TO SCHEMA ──────────────────────────────────
  describe("getHowToSchema", () => {
    it("should return valid HowTo schema", () => {
      const schema = getHowToSchema();
      expect(schema["@type"]).toBe("HowTo");
      expect(schema.step).toBeDefined();
      expect(schema.step.length).toBe(5);
      expect(schema.totalTime).toBe("PT5M");
    });

    it("should have sequential step positions", () => {
      const schema = getHowToSchema();
      schema.step.forEach((step, index) => {
        expect(step.position).toBe(index + 1);
        expect(step.name).toBeTruthy();
        expect(step.text).toBeTruthy();
      });
    });
  });

  // ─── WEBPAGE SCHEMA ─────────────────────────────────
  describe("getWebPageSchema", () => {
    it("should return home page schema by default", () => {
      const schema = getWebPageSchema();
      expect(schema["@type"]).toBe("WebPage");
      expect(schema.name).toContain("GlowUp AI");
    });

    it("should return upload page schema", () => {
      const schema = getWebPageSchema("upload");
      expect(schema.name).toContain("Upload");
      expect(schema.url).toContain("/upload");
    });

    it("should return premium page schema", () => {
      const schema = getWebPageSchema("premium");
      expect(schema.name).toContain("Premium");
    });
  });

  // ─── BREADCRUMB SCHEMA ──────────────────────────────
  describe("getBreadcrumbSchema", () => {
    it("should generate valid BreadcrumbList", () => {
      const items = [
        { name: "Home", url: "/" },
        { name: "Upload", url: "/upload" },
      ];
      const schema = getBreadcrumbSchema(items);
      expect(schema["@type"]).toBe("BreadcrumbList");
      expect(schema.itemListElement).toHaveLength(2);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
    });
  });

  // ─── REVIEW SCHEMA ──────────────────────────────────
  describe("getReviewSchema", () => {
    it("should return valid Product review schema", () => {
      const schema = getReviewSchema();
      expect(schema["@type"]).toBe("Product");
      expect(schema.review.length).toBeGreaterThan(0);
      expect(schema.aggregateRating.ratingValue).toBe("4.9");
    });
  });

  // ─── METADATA GENERATOR ─────────────────────────────
  describe("generatePageMetadata", () => {
    it("should generate complete metadata object", () => {
      const metadata = generatePageMetadata({
        title: "Test Page",
        description: "Test description",
        path: "/test",
      });

      expect(metadata.title).toContain("Test Page");
      expect(metadata.description).toBe("Test description");
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter.card).toBe("summary_large_image");
    });

    it("should set canonical URL from path", () => {
      const metadata = generatePageMetadata({
        title: "Upload",
        description: "Upload page",
        path: "/upload",
      });
      expect(metadata.alternates.canonical).toContain("/upload");
    });

    it("should handle noIndex flag", () => {
      const metadata = generatePageMetadata({
        title: "Private",
        description: "Private page",
        path: "/private",
        noIndex: true,
      });
      expect(metadata.robots.index).toBe(false);
      expect(metadata.robots.follow).toBe(false);
    });

    it("should not duplicate app name if already in title", () => {
      const metadata = generatePageMetadata({
        title: "GlowUp AI - Custom Title",
        description: "Test",
        path: "/",
      });
      expect(metadata.title).toBe("GlowUp AI - Custom Title");
      // Should NOT be "GlowUp AI - Custom Title | GlowUp AI"
      expect(metadata.title.match(/GlowUp AI/g).length).toBe(1);
    });
  });
});
