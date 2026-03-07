const DEFAULT_APP_SCHEMA = "app_showprep";

function normalizeSchema(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed;
}

export function resolveAppSchema() {
  return (
    normalizeSchema(process.env.APP_SCHEMA) ||
    normalizeSchema(process.env.NEXT_PUBLIC_APP_SCHEMA) ||
    normalizeSchema(process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA) ||
    DEFAULT_APP_SCHEMA
  );
}

export function applySchemaToPostgresUrl(rawUrl: string, schema: string) {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set("schema", schema);
    return url.toString();
  } catch {
    // If URL parsing fails, keep original value so runtime behavior is unchanged.
    return rawUrl;
  }
}
