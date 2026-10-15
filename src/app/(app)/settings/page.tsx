import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SettingsContent } from "./SettingsContent";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  // Check if user is org admin
  if (!session.user.isOrgAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="mt-4 text-xl font-semibold text-red-800">
            Access Denied
          </h1>
          <p className="mt-2 text-red-600">
            Only organization administrators can access settings.
          </p>
          <a
            href="/app"
            className="mt-6 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Return to App
          </a>
        </div>
      </div>
    );
  }

  return (
    <SettingsContent
      orgName={session.user.organization.name}
    />
  );
}
