import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!url || !serviceRoleKey) throw new Error("Missing server Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, serviceRoleKey);
}

export async function verifyHouseholdAccess(request: Request, householdId: string) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  const client = getClient();
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user?.id) return false;

  const { data: member } = await client
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return Boolean(member?.id);
}

export async function resolveSourceHousehold(sourceId: string) {
  const client = getClient();
  const { data } = await client.from("calendar_sources").select("household_id").eq("id", sourceId).single();
  return data?.household_id as string | undefined;
}
