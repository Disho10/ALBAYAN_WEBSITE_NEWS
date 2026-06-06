import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

// Server-side client with full access — only use in API routes
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
