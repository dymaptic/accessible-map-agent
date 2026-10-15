"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadAuthModules } from "@/lib/arcgis/loader";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        // Clear ArcGIS credentials from IdentityManager
        const { IdentityManager } = await loadAuthModules();
        IdentityManager.destroyCredentials();
      } catch (error) {
        console.error("Failed to clear ArcGIS credentials:", error);
      }

      try {
        // Clear our backend session
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (error) {
        console.error("Failed to clear backend session:", error);
      }

      // Redirect to signin
      router.push("/signin");
    };

    performSignOut();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-coral border-t-transparent" />
        <h1 className="mt-6 text-xl font-semibold text-white">Signing out...</h1>
      </div>
    </div>
  );
}
