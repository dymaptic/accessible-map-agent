"use client";

import { ReactNode, useEffect } from "react";
import { ArcGISAuthProvider, useArcGISAuth } from "./ArcGISAuthProvider";

interface AppAuthWrapperProps {
  children: ReactNode;
  clientId: string;
}

// Inner component that uses the auth context
function AuthChecker({ children }: { children: ReactNode }) {
  const { isInitialized, isSignedIn, isLoading, signIn, error } = useArcGISAuth();

  // If ArcGIS session expired but we have a server session,
  // the IdentityManager will prompt for re-auth
  useEffect(() => {
    if (isInitialized && !isSignedIn && !isLoading) {
      // User's ArcGIS token expired - trigger re-auth
      // This will redirect to ArcGIS for login
      signIn();
    }
  }, [isInitialized, isSignedIn, isLoading, signIn]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if auth failed
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Authentication Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => signIn()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AppAuthWrapper({ children, clientId }: AppAuthWrapperProps) {
  return (
    <ArcGISAuthProvider clientId={clientId}>
      <AuthChecker>{children}</AuthChecker>
    </ArcGISAuthProvider>
  );
}
