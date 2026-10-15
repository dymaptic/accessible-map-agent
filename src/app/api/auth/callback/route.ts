import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  getUserProfile,
  getOrgInfo,
  getArcGISConfig,
} from "@/lib/arcgis";
import { checkGroupAccess } from "@/lib/auth";
import { webhookNewUserRegistered, webhookNewOrgCreated } from "@/lib/webhooks";
import { notifyAdminsNewUser } from "@/lib/email";

const SESSION_DURATION_DAYS = 7;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${appUrl}/?error=oauth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/?error=missing_params`);
  }

  // Verify state parameter
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  // Clear the oauth_state cookie
  cookieStore.delete("oauth_state");

  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.access_token) {
      console.error("Token exchange failed:", tokenResponse);
      return NextResponse.redirect(`${appUrl}/?error=token_exchange_failed`);
    }

    // Fetch user profile
    const userProfile = await getUserProfile(tokenResponse.access_token);

    if (!userProfile.username || !userProfile.orgId) {
      console.error("Invalid user profile:", userProfile);
      return NextResponse.redirect(`${appUrl}/?error=invalid_profile`);
    }

    // Fetch organization info
    const orgInfo = await getOrgInfo(
      userProfile.orgId,
      tokenResponse.access_token
    );

    // Check if org already exists
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
      thumbnailUrl = `${config.portalUrl}/sharing/rest/community/users/${userProfile.username}/info/${userProfile.thumbnail}?token=${tokenResponse.access_token}`;
    }

    // Determine if user is org admin based on ArcGIS role
    const isOrgAdmin = userProfile.role === "org_admin";

    // Check if user already exists
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
    console.log(`[Auth Callback] Checking access for user ${user.arcgisUsername}:`, {
      isOrgAdmin: user.isOrgAdmin,
      orgTier: organization.tier,
      accessRestrictionEnabled: organization.accessRestrictionEnabled,
      accessGroups: organization.accessGroups,
    });
    const accessResult = await checkGroupAccess(
      { arcgisUsername: user.arcgisUsername, isOrgAdmin: user.isOrgAdmin },
      {
        tier: organization.tier,
        accessRestrictionEnabled: organization.accessRestrictionEnabled,
        accessGroups: organization.accessGroups,
      },
      tokenResponse.access_token
    );
    console.log(`[Auth Callback] Access result:`, accessResult);

    if (!accessResult.hasAccess) {
      console.log(`[Auth Callback] Access denied for user ${user.arcgisUsername}: ${accessResult.reason}`);
      return NextResponse.redirect(`${appUrl}/access-denied`);
    }

    // Calculate token expiry
    const tokenExpiry = new Date(
      Date.now() + tokenResponse.expires_in * 1000
    );

    // Calculate session expiry
    const sessionExpiry = new Date(
      Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    );

    // Create session (include admin bypass info for banner display)
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        tokenExpiry,
        expiresAt: sessionExpiry,
        isAdminBypassing: accessResult.isAdminBypassing,
        configuredGroupNames: accessResult.isAdminBypassing
          ? (accessResult.configuredGroupNames as string[])
          : undefined,
      },
    });

    // Set session cookie
    cookieStore.set("session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    // Queue webhooks and notifications for new users/orgs
    console.log(`[Auth Callback] isNewUser=${isNewUser}, isNewOrg=${isNewOrg}`);
    if (isNewUser || isNewOrg) {
      console.log("[Auth Callback] Queueing webhooks for new user/org...");
      try {
        // Queue webhook for new user
        const webhookId = await webhookNewUserRegistered({
          userId: user.id,
          username: user.arcgisUsername,
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          organizationId: organization.id,
          organizationName: organization.name,
          isNewOrg,
          isOrgAdmin,
        });
        console.log(`[Auth Callback] webhookNewUserRegistered returned: ${webhookId}`);

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
        // Log but don't fail the auth flow
        console.error("Failed to send notifications:", notifyError);
      }
    }

    // Redirect to app
    return NextResponse.redirect(`${appUrl}/app`);
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }
}
