import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export function isSupabaseClientConfigured(): boolean {
  return Boolean(url) && Boolean(anonKey) && anonKey !== "your_supabase_anon_key";
}

export const supabase = isSupabaseClientConfigured()
  ? createClient(url, anonKey)
  : null;
