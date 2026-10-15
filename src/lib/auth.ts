import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getUserGroups } from "./arcgis";

export type SessionWithUser = Awaited<ReturnType<typeof getSession>>;

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: { organization: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

/**
 * Check if a user is an app-level admin (hardcoded list in env)
 */
export function isAppAdmin(username: string): boolean {
  const admins = (process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase());
  return admins.includes(username.toLowerCase());
}

/**
 * Check if a user is an organization admin (from ArcGIS role)
 */
export function isOrgAdmin(user: { isOrgAdmin: boolean }): boolean {
  return user.isOrgAdmin;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require app admin - throws if not an app admin
 */
export async function requireAppAdmin() {
  const session = await requireAuth();
  if (!isAppAdmin(session.user.arcgisUsername)) {
    throw new Error("Forbidden");
  }
  return session;
}

// =============================================================================
// GROUP-BASED ACCESS CONTROL (Enterprise)
// =============================================================================

export interface AccessGroup {
  id: string;
  name: string;
}

export interface GroupAccessCheckResult {
  hasAccess: boolean;
  isAdminBypassing: boolean;
  configuredGroupNames: string[];
  reason:
    | "not_enterprise"
    | "restriction_disabled"
    | "no_groups_configured"
    | "is_admin"
    | "in_authorized_group"
    | "not_in_authorized_group"
    | "api_error";
}

/**
 * Check if a user has access based on group membership (Enterprise feature).
 *
 * Access is granted if:
 * 1. Organization is not Enterprise tier
 * 2. Access restriction is not enabled
 * 3. No groups are configured (misconfiguration fallback)
 * 4. User is an org admin or app-level admin
 * 5. User is a member of ANY configured group (OR logic)
 *
 * @param user - The user to check
 * @param organization - The organization with access control settings
 * @param token - ArcGIS access token for API calls
 * @returns Access check result with reason
 */
export async function checkGroupAccess(
  user: { arcgisUsername: string; isOrgAdmin: boolean },
  organization: {
    tier: string;
    accessRestrictionEnabled: boolean;
    accessGroups: unknown;
  },
  token: string
): Promise<GroupAccessCheckResult> {
  // Parse configured groups from JSON
  const configuredGroups: AccessGroup[] = Array.isArray(organization.accessGroups)
    ? (organization.accessGroups as AccessGroup[])
    : [];

  const configuredGroupNames = configuredGroups.map((g) => g.name);

  // 1. Not Enterprise tier - allow all
  if (organization.tier !== "ENTERPRISE") {
    return {
      hasAccess: true,
      isAdminBypassing: false,
      configuredGroupNames: [],
      reason: "not_enterprise",
    };
  }

  // 2. Access restriction not enabled - allow all
  if (!organization.accessRestrictionEnabled) {
    return {
      hasAccess: true,
      isAdminBypassing: false,
      configuredGroupNames: [],
      reason: "restriction_disabled",
    };
  }

  // 3. No groups configured - allow all (misconfiguration fallback)
  if (configuredGroups.length === 0) {
    return {
      hasAccess: true,
      isAdminBypassing: false,
      configuredGroupNames: [],
      reason: "no_groups_configured",
    };
  }

  // 4. Check if user is admin (org admin or app-level admin)
  const isAdmin = user.isOrgAdmin || isAppAdmin(user.arcgisUsername);

  if (isAdmin) {
    // Admin gets access, but check if they would otherwise be denied
    // to determine if we should show the bypass banner
    try {
      const userGroups = await getUserGroups(user.arcgisUsername, token);
      const userGroupIds = new Set(userGroups.map((g) => g.id));
      const configuredGroupIds = configuredGroups.map((g) => g.id);
      const inAuthorizedGroup = configuredGroupIds.some((id) => userGroupIds.has(id));

      return {
        hasAccess: true,
        isAdminBypassing: !inAuthorizedGroup,
        configuredGroupNames,
        reason: "is_admin",
      };
    } catch (error) {
      // If API fails for admin, still allow access but note the bypass
      console.error("Error checking admin group membership:", error);
      return {
        hasAccess: true,
        isAdminBypassing: true,
        configuredGroupNames,
        reason: "is_admin",
      };
    }
  }

  // 5. Check group membership for regular users
  try {
    const userGroups = await getUserGroups(user.arcgisUsername, token);
    const userGroupIds = new Set(userGroups.map((g) => g.id));
    const configuredGroupIds = configuredGroups.map((g) => g.id);

    const hasAccess = configuredGroupIds.some((id) => userGroupIds.has(id));

    return {
      hasAccess,
      isAdminBypassing: false,
      configuredGroupNames,
      reason: hasAccess ? "in_authorized_group" : "not_in_authorized_group",
    };
  } catch (error) {
    // Fail closed - deny access if API fails
    console.error("Error checking group membership:", error);
    return {
      hasAccess: false,
      isAdminBypassing: false,
      configuredGroupNames,
      reason: "api_error",
    };
  }
}
