import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      name: true,
      sharingOptIn: true,
      tier: true,
      status: true,
      billingFrequency: true,
      periodEndDate: true,
      scheduledDowngradeTier: true,
      scheduledDowngradeDate: true,
    },
  });

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json(organization);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is org admin
  if (!session.user.isOrgAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { sharingOptIn?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate input
  if (typeof body.sharingOptIn !== "boolean") {
    return NextResponse.json(
      { error: "sharingOptIn must be a boolean" },
      { status: 400 }
    );
  }

  const organization = await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { sharingOptIn: body.sharingOptIn },
    select: {
      id: true,
      name: true,
      sharingOptIn: true,
    },
  });

  return NextResponse.json(organization);
}
