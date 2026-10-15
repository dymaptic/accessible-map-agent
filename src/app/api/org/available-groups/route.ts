import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgGroups } from "@/lib/arcgis";

/**
 * GET /api/org/available-groups
 * Returns all groups available in the organization for the access control dropdown.
 * Only accessible by org admins of Enterprise tier organizations.
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is org admin
  if (!session.user.isOrgAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      id: true,
      tier: true,
      arcgisOrgId: true,
    },
  });

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Feature only available for Enterprise tier
  if (organization.tier !== "ENTERPRISE") {
    return NextResponse.json(
      { error: "This feature is only available for Enterprise tier" },
      { status: 403 }
    );
  }

  try {
    const { groups, total } = await getOrgGroups(
      organization.arcgisOrgId,
      session.accessToken
    );

    return NextResponse.json({
      groups: groups.map(g => ({
        id: g.id,
        title: g.title,
        memberCount: g.memberCount,
      })),
      total,
    });
  } catch (error) {
    console.error("Error fetching org groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups from ArcGIS" },
      { status: 500 }
    );
  }
}
