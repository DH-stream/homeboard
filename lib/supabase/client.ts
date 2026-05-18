import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getCloudConfig, isCloudConfigured } from "@/lib/cloud/config";

export { isCloudConfigured };

export function isSupabaseConfigured() {
  return isCloudConfigured();
}

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const config = getCloudConfig();
  if (!config) return null;
  return createClient(config.url, config.publishableKey);
}
