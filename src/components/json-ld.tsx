type JsonLdProps = {
  // Keep this generic: callers pass a plain JSON-serializable object.
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD requires raw JSON (not escaped HTML).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
