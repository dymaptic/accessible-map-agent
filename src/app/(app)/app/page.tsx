import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppContent } from "./AppContent";

export default async function AppPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <AppContent
      username={session.user.arcgisUsername}
      orgId={session.user.organization.arcgisOrgId}
    />
  );
}
