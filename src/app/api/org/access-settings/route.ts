import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyGroupsExist, type ArcGISGroup } from "@/lib/arcgis";

interface AccessGroup {
  id: string;
  name: string;
}

/**
 * GET /api/org/access-settings
 * Returns the organization's access control settings.
 * Also validates that configured groups still exist and returns any removed ones.
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
      accessRestrictionEnabled: true,
      accessGroups: true,
    },
  });

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Feature only available for Enterprise tier
  if (organization.tier !== "ENTERPRISE") {
    return NextResponse.json({
      accessRestrictionEnabled: false,
      accessGroups: [],
      removedGroups: [],
      isEnterprise: false,
    });
  }

  // Parse stored groups
  const storedGroups: AccessGroup[] = Array.isArray(organization.accessGroups)
    ? (organization.accessGroups as unknown as AccessGroup[])
    : [];

  // If no groups configured, return early
  if (storedGroups.length === 0) {
    return NextResponse.json({
      accessRestrictionEnabled: organization.accessRestrictionEnabled,
      accessGroups: [],
      removedGroups: [],
      isEnterprise: true,
    });
  }

  // Verify groups still exist in ArcGIS
  try {
    const { validGroups, invalidGroupIds } = await verifyGroupsExist(
      storedGroups.map(g => g.id),
      organization.arcgisOrgId,
      session.accessToken
    );

    // Build the response groups with stored names (for consistency)
    const accessGroups = validGroups.map(g => ({
      id: g.id,
      name: g.title,
      memberCount: g.memberCount,
    }));

    // Find removed groups (groups that were stored but no longer exist)
    const removedGroups = storedGroups.filter(sg =>
      invalidGroupIds.includes(sg.id)
    );

    // If any groups were removed, update the database
    if (removedGroups.length > 0) {
      const validGroupData = accessGroups.map(g => ({
        id: g.id,
        name: g.name,
      }));

      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          accessGroups: validGroupData.length > 0 ? validGroupData : undefined,
        },
      });
    }

    return NextResponse.json({
      accessRestrictionEnabled: organization.accessRestrictionEnabled,
      accessGroups,
      removedGroups,
      isEnterprise: true,
    });
  } catch (error) {
    console.error("Error verifying groups:", error);
    // Return stored groups without verification if API fails
    return NextResponse.json({
      accessRestrictionEnabled: organization.accessRestrictionEnabled,
      accessGroups: storedGroups,
      removedGroups: [],
      isEnterprise: true,
      warning: "Could not verify groups with ArcGIS",
    });
  }
}

/**
 * PATCH /api/org/access-settings
 * Updates the organization's access control settings.
 */
export async function PATCH(request: NextRequest) {
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

  let body: {
    accessRestrictionEnabled?: boolean;
    accessGroupIds?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate input
  if (typeof body.accessRestrictionEnabled !== "boolean") {
    return NextResponse.json(
      { error: "accessRestrictionEnabled must be a boolean" },
      { status: 400 }
    );
  }

  // If enabling restriction, groups must be provided
  if (body.accessRestrictionEnabled) {
    if (!Array.isArray(body.accessGroupIds) || body.accessGroupIds.length === 0) {
      return NextResponse.json(
        { error: "At least one group must be selected when enabling access restriction" },
        { status: 400 }
      );
    }

    // Verify all provided groups exist
    try {
      const { validGroups, invalidGroupIds } = await verifyGroupsExist(
        body.accessGroupIds,
        organization.arcgisOrgId,
        session.accessToken
      );

      if (invalidGroupIds.length > 0) {
        return NextResponse.json(
          {
            error: "Some groups do not exist or are not accessible",
            invalidGroupIds,
          },
          { status: 400 }
        );
      }

      // Store groups with id and name
      const accessGroupsData = validGroups.map((g: ArcGISGroup) => ({
        id: g.id,
        name: g.title,
      }));

      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          accessRestrictionEnabled: true,
          accessGroups: accessGroupsData,
        },
      });

      return NextResponse.json({
        accessRestrictionEnabled: true,
        accessGroups: validGroups.map(g => ({
          id: g.id,
          name: g.title,
          memberCount: g.memberCount,
        })),
      });
    } catch (error) {
      console.error("Error verifying groups:", error);
      return NextResponse.json(
        { error: "Failed to verify groups with ArcGIS" },
        { status: 500 }
      );
    }
  } else {
    // Disabling restriction - just update the flag
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        accessRestrictionEnabled: false,
      },
    });

    return NextResponse.json({
      accessRestrictionEnabled: false,
      accessGroups: [],
    });
  }
}
