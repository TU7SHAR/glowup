import { render } from "@testing-library/react";
import StructuredData from "@/app/components/StructuredData";

describe("StructuredData Component", () => {
  it("should render JSON-LD scripts for each schema", () => {
    const schemas = [
      { "@type": "Organization", name: "Test Org" },
      { "@type": "FAQPage", mainEntity: [] },
    ];

    const { container } = render(<StructuredData schemas={schemas} />);
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts).toHaveLength(2);
  });

  it("should contain valid JSON in script tags", () => {
    const schemas = [{ "@context": "https://schema.org", "@type": "Organization", name: "GlowUp AI" }];

    const { container } = render(<StructuredData schemas={schemas} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script.textContent);
    expect(parsed["@type"]).toBe("Organization");
    expect(parsed.name).toBe("GlowUp AI");
  });

  it("should render nothing when schemas is empty", () => {
    const { container } = render(<StructuredData schemas={[]} />);
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts).toHaveLength(0);
  });

  it("should render nothing when schemas is null", () => {
    const { container } = render(<StructuredData schemas={null} />);
    expect(container.innerHTML).toBe("");
  });
});
