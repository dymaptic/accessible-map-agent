"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadAuthModules } from "@/lib/arcgis/loader";

interface SignInClientProps {
  clientId: string;
}

export function SignInClient({ clientId }: SignInClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initSignIn = async () => {
      try {
        // Load ArcGIS modules from CDN
        const { IdentityManager, OAuthInfo } = await loadAuthModules();

        const portalUrl = "https://www.arcgis.com";

        // Configure OAuth
        const oauthInfo = new OAuthInfo({
          appId: clientId,
          portalUrl,
          popup: false,
          flowType: "authorization-code",
        });

        IdentityManager.registerOAuthInfos([oauthInfo]);

        // Check if already signed in
        try {
          const credential = await IdentityManager.checkSignInStatus(`${portalUrl}/sharing`);

          if (mounted) {
            // Already signed in - sync with backend and redirect
            await syncAndRedirect(credential.token);
          }
          return;
        } catch {
          // Not signed in - proceed to get credentials
        }

        // Initiate sign in
        const credential = await IdentityManager.getCredential(`${portalUrl}/sharing`, {
          oAuthPopupConfirmation: false,
        });

        if (mounted) {
          await syncAndRedirect(credential.token);
        }
      } catch (err) {
        console.error("Sign in error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Sign in failed");
          setIsLoading(false);
        }
      }
    };

    const syncAndRedirect = async (token: string) => {
      // Send token to backend to create session
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Handle access denied - redirect to access-denied page
        if (data.error === "access_denied") {
          router.push("/access-denied");
          return;
        }
        throw new Error(data.error || "Failed to create session");
      }

      // Redirect to app
      router.push("/app");
    };

    initSignIn();

    return () => {
      mounted = false;
    };
  }, [router, clientId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-bg">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-coral/20">
            <svg className="h-8 w-8 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Sign In Failed</h1>
          <p className="mt-2 text-gray-400">{error}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-coral px-4 py-3 font-semibold uppercase tracking-wide text-white hover:bg-coral-dark"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-teal px-4 py-3 font-semibold text-teal-light hover:bg-teal/10"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-coral border-t-transparent" />
        <h1 className="mt-6 text-xl font-semibold text-white">
          {isLoading ? "Connecting to ArcGIS..." : "Signing in..."}
        </h1>
        <p className="mt-2 text-gray-400">
          You will be redirected to ArcGIS to sign in
        </p>
      </div>
    </div>
  );
}
