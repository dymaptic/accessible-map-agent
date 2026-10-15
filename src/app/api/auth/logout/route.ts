import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function performLogout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    // Delete session from database
    try {
      await prisma.session.delete({
        where: { id: sessionId },
      });
    } catch {
      // Session may already be deleted or expired
    }

    // Clear session cookie
    cookieStore.delete("session_id");
  }
}

export async function POST() {
  await performLogout();
  return NextResponse.json({ success: true });
}

// GET handler for direct link logout (e.g., from access-denied page)
export async function GET() {
  await performLogout();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/signin`);
}
