/**
 * StructuredData Component
 * Renders JSON-LD schema markup for SEO, AEO, and GEO optimization
 */

export default function StructuredData({ schemas }) {
  if (!schemas || schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </>
  );
}
