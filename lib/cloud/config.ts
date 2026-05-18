export type CloudConfig = {
  url: string;
  publishableKey: string;
  source: "env" | "official";
};

const OFFICIAL_HOMEBOARD_CLOUD_URL = "https://bnnyrnsusqjqhtymfycm.supabase.co";
const OFFICIAL_HOMEBOARD_CLOUD_PUBLISHABLE_KEY = "sb_publishable_homeboard_official_cloud_key_required";
const DISABLE_BUILT_IN_CLOUD = process.env.NEXT_PUBLIC_HOMEBOARD_DISABLE_BUILT_IN_CLOUD === "true";

function getEnvCloudConfig(): CloudConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

  if (!url || !publishableKey) return null;
  return { url, publishableKey, source: "env" };
}

function getOfficialCloudConfig(): CloudConfig | null {
  if (DISABLE_BUILT_IN_CLOUD) return null;
  if (!OFFICIAL_HOMEBOARD_CLOUD_URL || !OFFICIAL_HOMEBOARD_CLOUD_PUBLISHABLE_KEY) return null;
  return {
    url: OFFICIAL_HOMEBOARD_CLOUD_URL,
    publishableKey: OFFICIAL_HOMEBOARD_CLOUD_PUBLISHABLE_KEY,
    source: "official",
  };
}

export function getCloudConfig(): CloudConfig | null {
  return getEnvCloudConfig() ?? getOfficialCloudConfig();
}

export function isCloudConfigured() {
  return Boolean(getCloudConfig());
}
