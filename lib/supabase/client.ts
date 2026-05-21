import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getCloudConfig, isCloudConfigured } from "@/lib/cloud/config";

export { isCloudConfigured };

let browserClient: SupabaseClient | null = null;
let browserClientKey: string | null = null;

export function isSupabaseConfigured() {
  return isCloudConfigured();
}

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const config = getCloudConfig();
  if (!config) {
    browserClient = null;
    browserClientKey = null;
    return null;
  }

  const nextKey = `${config.url}:${config.publishableKey}`;
  if (browserClient && browserClientKey === nextKey) {
    return browserClient;
  }

  browserClient = createClient(config.url, config.publishableKey);
  browserClientKey = nextKey;
  return browserClient;
}
