"use client";

import { createClient } from "@supabase/supabase-js";
import { resolveAppSchema } from "@/lib/app-schema";

let loggedClientSchema = false;

export function createBrowserDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const schema = resolveAppSchema();
  const supabase = createClient(url, anonKey);
  const db = supabase.schema(schema);

  if ((process.env.NEXT_PUBLIC_DEBUG_DATA === "true" || process.env.DEBUG_DATA === "true") && !loggedClientSchema) {
    loggedClientSchema = true;
    console.info(`[DATA DEBUG] client schema resolved: ${schema}`);
  }

  return { supabase, db, schema };
}
