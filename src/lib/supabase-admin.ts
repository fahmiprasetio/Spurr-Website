import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(url) && Boolean(serviceKey) && serviceKey !== "your_supabase_service_role_key";
}

export const supabaseAdmin = isSupabaseAdminConfigured()
  ? createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
