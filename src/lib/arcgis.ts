// Use getter functions to ensure env vars are read at runtime, not build time
export function getArcGISConfig() {
  return {
    portalUrl: "https://www.arcgis.com",
    clientId: process.env.ARCGIS_CLIENT_ID!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
  };
}

export function getAuthorizeUrl(state: string): string {
  const config = getArcGISConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    state,
  });
  return `${config.portalUrl}/sharing/rest/oauth2/authorize?${params}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  username: string;
}

export async function exchangeCodeForToken(
  code: string
): Promise<TokenResponse> {
  const config = getArcGISConfig();
  const response = await fetch(
    `${config.portalUrl}/sharing/rest/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
      }),
    }
  );
  return response.json();
}

export interface ArcGISUserProfile {
  username: string;
  fullName: string;
  email: string;
  orgId: string;
  thumbnail?: string;
  role?: string; // "org_admin", "org_publisher", "org_user"
}

export interface ArcGISOrgInfo {
  id: string;
  name: string;
}

export async function getUserProfile(token: string): Promise<ArcGISUserProfile> {
  const config = getArcGISConfig();
  const response = await fetch(
    `${config.portalUrl}/sharing/rest/community/self?f=json&token=${token}`
  );
  return response.json();
}

export async function getOrgInfo(
  orgId: string,
  token: string
): Promise<ArcGISOrgInfo> {
  const config = getArcGISConfig();
  const response = await fetch(
    `${config.portalUrl}/sharing/rest/portals/${orgId}?f=json&token=${token}`
  );
  return response.json();
}

export async function reverseGeocode(
  longitude: number,
  latitude: number
): Promise<{ address: string; city?: string; region?: string; country?: string }> {
  const response = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${longitude},${latitude}&f=json`
  );
  const data = await response.json();
  return {
    address: data.address?.Match_addr || "",
    city: data.address?.City,
    region: data.address?.Region,
    country: data.address?.CountryCode,
  };
}

// =============================================================================
// GROUP-RELATED FUNCTIONS (for Enterprise access control)
// =============================================================================

export interface ArcGISGroup {
  id: string;
  title: string;
  owner?: string;
  memberCount?: number;
}

interface UserGroupsResponse {
  groups?: ArcGISGroup[];
  error?: { code: number; message: string };
}

interface OrgGroupsResponse {
  results?: ArcGISGroup[];
  total?: number;
  start?: number;
  num?: number;
  nextStart?: number;
  error?: { code: number; message: string };
}

/**
 * Get all groups that a user belongs to.
 * Used to check if a user is a member of any authorized groups.
 */
export async function getUserGroups(
  username: string,
  token: string
): Promise<ArcGISGroup[]> {
  const config = getArcGISConfig();
  const response = await fetch(
    `${config.portalUrl}/sharing/rest/community/users/${encodeURIComponent(username)}?f=json&token=${token}`
  );
  const data: UserGroupsResponse = await response.json();

  if (data.error) {
    console.error("Error fetching user groups:", data.error);
    throw new Error(`ArcGIS API error: ${data.error.message}`);
  }

  return data.groups || [];
}

/**
 * Get all groups visible to the organization.
 * Used to populate the group selection dropdown for admins.
 * Handles pagination to fetch all groups.
 */
export async function getOrgGroups(
  orgId: string,
  token: string,
  options?: { maxResults?: number }
): Promise<{ groups: ArcGISGroup[]; total: number }> {
  const config = getArcGISConfig();
  const maxResults = options?.maxResults ?? 500; // Safety limit
  const pageSize = 100; // ArcGIS max per request

  const allGroups: ArcGISGroup[] = [];
  let start = 1;
  let total = 0;

  while (true) {
    const url = `${config.portalUrl}/sharing/rest/community/groups?q=orgid:${encodeURIComponent(orgId)}&num=${pageSize}&start=${start}&f=json&token=${token}`;
    const response = await fetch(url);
    const data: OrgGroupsResponse = await response.json();

    if (data.error) {
      console.error("Error fetching org groups:", data.error);
      throw new Error(`ArcGIS API error: ${data.error.message}`);
    }

    const groups = data.results || [];
    allGroups.push(...groups);
    total = data.total || allGroups.length;

    // Check if there are more pages
    const nextStart = data.nextStart ?? -1;
    if (nextStart === -1 || allGroups.length >= maxResults) {
      break;
    }

    start = nextStart;
  }

  // Sort alphabetically by title
  allGroups.sort((a, b) => a.title.localeCompare(b.title));

  return { groups: allGroups, total };
}

/**
 * Verify that specific groups exist in the organization.
 * Returns the groups that exist and those that don't.
 */
export async function verifyGroupsExist(
  groupIds: string[],
  orgId: string,
  token: string
): Promise<{ validGroups: ArcGISGroup[]; invalidGroupIds: string[] }> {
  if (groupIds.length === 0) {
    return { validGroups: [], invalidGroupIds: [] };
  }

  const { groups: orgGroups } = await getOrgGroups(orgId, token);
  const orgGroupMap = new Map(orgGroups.map(g => [g.id, g]));

  const validGroups: ArcGISGroup[] = [];
  const invalidGroupIds: string[] = [];

  for (const id of groupIds) {
    const group = orgGroupMap.get(id);
    if (group) {
      validGroups.push(group);
    } else {
      invalidGroupIds.push(id);
    }
  }

  return { validGroups, invalidGroupIds };
}
