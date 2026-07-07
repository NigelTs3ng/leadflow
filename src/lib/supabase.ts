import { createClient } from "@supabase/supabase-js";

// Single-user, no-login setup: we use the anon key everywhere (server + client)
// because Row Level Security is disabled on purpose for now. See supabase/schema.sql.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Thrown lazily (at first use) rather than at import time in some environments,
  // but throwing here gives a much clearer error than a vague fetch failure later.
  console.warn(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.local.example to .env.local and fill in your Supabase project values."
  );
}

// Fallback lets `next build` succeed even before .env.local is filled in;
// real requests will simply fail until you set the real values.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  { auth: { persistSession: false } }
);

export type EntityType = "company" | "company_sector" | "lead" | "follow_up";
