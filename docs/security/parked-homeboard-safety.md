# Parked HomeBoard — scoped RPC safety hardening

HomeBoard is parked, not deleted. Heating operates in a separate private database
schema; Health is another existing app sharing the database project. This change
does not alter Health, Heating, Supabase Auth, or existing data.

## Identified exposure

- upsert_household_streak_completion(uuid,date) can currently update arbitrary
  household streak statistics when invoked anonymously with a known UUID.
- calculate_household_streak_from_day_status(uuid,date) can currently disclose
  aggregate streak information without household authorization.

Both are SECURITY DEFINER routines in the exposed public schema.

## Proposed fix (not deployed)

Migration 0022_secure_household_streak_rpcs.sql preserves the original streak
algorithm by renaming it to an internal privileged helper. It reintroduces the
existing browser RPC with a household membership check. Existing linked devices
continue to update via their separate token-verified RPC, which now calls the
privileged helper. Direct anonymous access to the raw streak routines is
revoked. The existing device pairing flows and their permissions are unchanged.

No rows, user accounts, credentials, schema or tables are removed. HomeBoard
can be resumed using its existing browser/device interfaces and saved data.

## Release gate

1. Review the actual SQL and compare the affected function definitions with the
   production versions (including any later patches).
2. Test it in a disposable or branched database with representative schema:
   signed-in member works; signed-in non-member denied; anonymous browser denied;
   valid device token works; invalid device token denied.
3. Explicitly approve any production shared-database migration.
4. After release, run the read-only permission checks in
   security/check_homeboard_streak_permissions.sql.
5. Smoke-test Heating and Health without touching either application's data.

## Backout / recovery

The previous streak algorithm exists, unchanged, as the privileged internal
helper. If rollback is needed, restore the RPC definitions from HomeBoard
migrations 0016 and 0017, then carefully restore previous function grants from
the audited live permissions. Do not drop the helper while other routines
reference it. Restoring earlier grants also reopens the original issue.

This patch does not remove all public RPC security advisories. Other dormant
HomeBoard functions and the separate Health integration require their own
compatibility review before restricting privileges. Complete administrative
isolation is not possible while all apps share one Supabase project.
