import { redirect } from "next/navigation";
import { getSession, isAppAdmin } from "@/lib/auth";
import { AdminDashboard } from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (!isAppAdmin(session.user.arcgisUsername)) {
    redirect("/app");
  }

  return <AdminDashboard adminUsername={session.user.arcgisUsername} />;
}
