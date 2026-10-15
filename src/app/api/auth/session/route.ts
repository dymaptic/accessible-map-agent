import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, isAppAdmin, checkGroupAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserProfile, getOrgInfo, getArcGISConfig } from "@/lib/arcgis";
import { webhookNewUserRegistered, webhookNewOrgCreated } from "@/lib/webhooks";
import { notifyAdminsNewUser } from "@/lib/email";

const SESSION_DURATION_DAYS = 7;

// GET: Return current session info
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { user } = session;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.arcgisUsername,
      email: user.email,
      displayName: user.displayName,
      thumbnailUrl: user.thumbnailUrl,
      isOrgAdmin: user.isOrgAdmin,
      isAppAdmin: isAppAdmin(user.arcgisUsername),
      organization: {
        id: user.organization.id,
        arcgisOrgId: user.organization.arcgisOrgId,
        name: user.organization.name,
      },
    },
    // Note: accessToken is no longer returned - use IdentityManager.getCredential() client-side
  });
}

// POST: Create session from ArcGIS token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Validate token with ArcGIS by fetching user profile
    const userProfile = await getUserProfile(token);

    if (!userProfile.username) {
      return NextResponse.json(
        { error: "Invalid token - could not fetch user profile" },
        { status: 401 }
      );
    }

    if (!userProfile.orgId) {
      return NextResponse.json(
        { error: "User must belong to an ArcGIS organization" },
        { status: 403 }
      );
    }

    // Fetch organization info
    const orgInfo = await getOrgInfo(userProfile.orgId, token);

    // Check if org already exists (for webhook)
    const existingOrg = await prisma.organization.findUnique({
      where: { arcgisOrgId: userProfile.orgId },
    });
    const isNewOrg = !existingOrg;

    // Upsert organization
    const organization = await prisma.organization.upsert({
      where: { arcgisOrgId: userProfile.orgId },
      update: {
        name: orgInfo.name || userProfile.orgId,
      },
      create: {
        arcgisOrgId: userProfile.orgId,
        name: orgInfo.name || userProfile.orgId,
      },
      select: {
        id: true,
        arcgisOrgId: true,
        name: true,
        tier: true,
        accessRestrictionEnabled: true,
        accessGroups: true,
      },
    });

    // Build thumbnail URL if available
    let thumbnailUrl: string | null = null;
    if (userProfile.thumbnail) {
      const config = getArcGISConfig();
      thumbnailUrl = `${config.portalUrl}/sharing/rest/community/users/${userProfile.username}/info/${userProfile.thumbnail}?token=${token}`;
    }

    // Determine if user is org admin based on ArcGIS role
    const isOrgAdmin = userProfile.role === "org_admin";

    // Check if user already exists (for webhook)
    const existingUser = await prisma.user.findUnique({
      where: { arcgisUsername: userProfile.username },
    });
    const isNewUser = !existingUser;

    // Upsert user
    const user = await prisma.user.upsert({
      where: { arcgisUsername: userProfile.username },
      update: {
        email: userProfile.email || null,
        displayName: userProfile.fullName || null,
        thumbnailUrl,
        isOrgAdmin,
        lastLoginAt: new Date(),
        organizationId: organization.id,
      },
      create: {
        arcgisUsername: userProfile.username,
        email: userProfile.email || null,
        displayName: userProfile.fullName || null,
        thumbnailUrl,
        isOrgAdmin,
        organizationId: organization.id,
      },
    });

    // Check group-based access control (Enterprise feature)
    console.log(`[Auth Session] Checking access for user ${user.arcgisUsername}:`, {
      isOrgAdmin: user.isOrgAdmin,
      orgTier: organization.tier,
      accessRestrictionEnabled: organization.accessRestrictionEnabled,
      accessGroups: organization.accessGroups,
    });
    const accessResult = await checkGroupAccess(
      { arcgisUsername: user.arcgisUsername, isOrgAdmin },
      {
        tier: organization.tier,
        accessRestrictionEnabled: organization.accessRestrictionEnabled,
        accessGroups: organization.accessGroups,
      },
      token
    );
    console.log(`[Auth Session] Access result:`, accessResult);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: "access_denied", reason: accessResult.reason },
        { status: 403 }
      );
    }

    // Delete any existing sessions for this user (single session per user)
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Calculate session expiry
    const sessionExpiry = new Date(
      Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    );

    // Create new session (include admin bypass info for banner display)
    // Note: We store the token but IdentityManager will manage refresh
    // This token is primarily used for server-side ArcGIS API calls if needed
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        accessToken: token,
        refreshToken: null, // IdentityManager handles refresh client-side
        tokenExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000), // Assume 2hr token life
        expiresAt: sessionExpiry,
        isAdminBypassing: accessResult.isAdminBypassing,
        configuredGroupNames: accessResult.isAdminBypassing
          ? (accessResult.configuredGroupNames as string[])
          : undefined,
      },
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    // Queue webhooks and notifications for new users/orgs
    if (isNewUser || isNewOrg) {
      try {
        // Queue webhook for new user
        await webhookNewUserRegistered({
          userId: user.id,
          username: user.arcgisUsername,
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          organizationId: organization.id,
          organizationName: organization.name,
          isNewOrg,
          isOrgAdmin,
        });

        // Queue webhook for new org (if applicable)
        if (isNewOrg) {
          await webhookNewOrgCreated({
            organizationId: organization.id,
            organizationName: organization.name,
            arcgisOrgId: userProfile.orgId,
            creatingUserId: user.id,
            creatingUsername: user.arcgisUsername,
          });
        }

        // Send admin notification email
        await notifyAdminsNewUser({
          username: user.arcgisUsername,
          email: user.email || undefined,
          orgName: organization.name,
          isNewOrg,
        });
      } catch (notifyError) {
        // Log but don't fail the session creation
        console.error("Failed to send notifications:", notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.arcgisUsername,
        displayName: user.displayName,
        isOrgAdmin,
        isAppAdmin: isAppAdmin(user.arcgisUsername),
        organization: {
          id: organization.id,
          name: organization.name,
        },
      },
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
