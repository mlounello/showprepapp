import { createClient } from "@supabase/supabase-js";
import { resolveAppSchema } from "@/lib/app-schema";

export function createServerDbClient(context?: { requestLabel?: string }) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL/SUPABASE_ANON_KEY (or NEXT_PUBLIC_* equivalents)");
  }

  const schema = resolveAppSchema();
  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const db = supabase.schema(schema);

  if (process.env.DEBUG_DATA === "true") {
    console.info(`[DATA DEBUG] server schema resolved: ${schema}${context?.requestLabel ? ` (${context.requestLabel})` : ""}`);
  }

  return { supabase, db, schema };
}
