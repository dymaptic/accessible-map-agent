import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthorizeUrl } from "@/lib/arcgis";

export async function GET() {
  // Generate random state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in cookie for verification in callback
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  // Redirect to ArcGIS authorize URL
  const authorizeUrl = getAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}
