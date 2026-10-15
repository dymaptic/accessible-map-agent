import { redirect } from "next/navigation";
import { getSession, isAppAdmin } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppAuthWrapper } from "@/components/auth/AppAuthWrapper";
import { AdminBypassBanner } from "@/components/AdminBypassBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If no server session, redirect to home
  // User will need to sign in via landing page
  if (!session) {
    redirect("/");
  }

  const clientId = process.env.ARCGIS_CLIENT_ID;
  if (!clientId) {
    throw new Error("ARCGIS_CLIENT_ID environment variable is not set");
  }

  const showAdminNav = isAppAdmin(session.user.arcgisUsername);
  const showSettingsNav = session.user.isOrgAdmin;

  // Check if admin is bypassing group restrictions (for banner display)
  const isAdminBypassing = session.isAdminBypassing ?? false;
  const configuredGroupNames = Array.isArray(session.configuredGroupNames)
    ? (session.configuredGroupNames as string[])
    : [];

  return (
    <AppAuthWrapper clientId={clientId}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {isAdminBypassing && configuredGroupNames.length > 0 && (
          <AdminBypassBanner groupNames={configuredGroupNames} />
        )}
        <AppHeader
          user={session.user}
          showAdminNav={showAdminNav}
          showSettingsNav={showSettingsNav}
        />
        <main className="flex-1">{children}</main>
      </div>
    </AppAuthWrapper>
  );
}
