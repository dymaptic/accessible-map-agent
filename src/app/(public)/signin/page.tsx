import { SignInClient } from "./SignInClient";

// Force dynamic rendering so env vars are read at runtime, not build time
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const clientId = process.env.ARCGIS_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-bg">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-coral/20">
            <svg className="h-8 w-8 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Configuration Error</h1>
          <p className="mt-2 text-gray-400">ArcGIS Client ID is not configured. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  return <SignInClient clientId={clientId} />;
}
