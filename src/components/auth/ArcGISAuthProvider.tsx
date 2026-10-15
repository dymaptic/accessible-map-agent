"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { loadAuthModules } from "@/lib/arcgis/loader";

interface ArcGISCredential {
  token: string;
  expires: number;
  userId: string;
}

interface AuthState {
  isInitialized: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  credential: ArcGISCredential | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useArcGISAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useArcGISAuth must be used within ArcGISAuthProvider");
  }
  return context;
}

interface ArcGISAuthProviderProps {
  children: ReactNode;
  clientId: string;
  portalUrl?: string;
}

export function ArcGISAuthProvider({
  children,
  clientId,
  portalUrl = "https://www.arcgis.com",
}: ArcGISAuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isInitialized: false,
    isSignedIn: false,
    isLoading: true,
    credential: null,
    error: null,
  });

  // Initialize IdentityManager on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { IdentityManager, OAuthInfo } = await loadAuthModules();

        // Configure OAuth
        const oauthInfo = new OAuthInfo({
          appId: clientId,
          portalUrl,
          popup: false, // Use redirect instead of popup
          flowType: "authorization-code",
          preserveUrlHash: true,
        });

        IdentityManager.registerOAuthInfos([oauthInfo]);

        // Check if user is already signed in
        try {
          const credential = await IdentityManager.checkSignInStatus(
            `${portalUrl}/sharing`
          );

          if (mounted) {
            // Verify with our backend to create/update session
            await syncWithBackend(credential.token);

            setState({
              isInitialized: true,
              isSignedIn: true,
              isLoading: false,
              credential: {
                token: credential.token,
                expires: credential.expires ?? Date.now() + 7200000, // Default 2hr if undefined
                userId: credential.userId ?? "",
              },
              error: null,
            });
          }
        } catch {
          // Not signed in - that's ok
          if (mounted) {
            setState({
              isInitialized: true,
              isSignedIn: false,
              isLoading: false,
              credential: null,
              error: null,
            });
          }
        }
      } catch (error) {
        console.error("Failed to initialize ArcGIS auth:", error);
        if (mounted) {
          setState({
            isInitialized: true,
            isSignedIn: false,
            isLoading: false,
            credential: null,
            error: "Failed to initialize authentication",
          });
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [clientId, portalUrl]);

  // Sync credential with our backend
  const syncWithBackend = async (token: string) => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Failed to sync with backend:", error);
      throw error;
    }
  };

  // Sign in
  const signIn = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { IdentityManager } = await loadAuthModules();

      const credential = await IdentityManager.getCredential(`${portalUrl}/sharing`, {
        oAuthPopupConfirmation: false,
      });

      // Sync with our backend
      await syncWithBackend(credential.token);

      setState({
        isInitialized: true,
        isSignedIn: true,
        isLoading: false,
        credential: {
          token: credential.token,
          expires: credential.expires ?? Date.now() + 7200000, // Default 2hr if undefined
          userId: credential.userId ?? "",
        },
        error: null,
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      }));
    }
  }, [portalUrl]);

  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { IdentityManager } = await loadAuthModules();

      // Clear ArcGIS credentials
      IdentityManager.destroyCredentials();

      // Clear our backend session
      await fetch("/api/auth/logout", { method: "POST" });

      setState({
        isInitialized: true,
        isSignedIn: false,
        isLoading: false,
        credential: null,
        error: null,
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      }));
    }
  }, []);

  // Get current valid token (refreshed if needed by IdentityManager)
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!state.isSignedIn) return null;

    try {
      const { IdentityManager } = await loadAuthModules();

      const credential = await IdentityManager.getCredential(`${portalUrl}/sharing`);
      return credential.token;
    } catch {
      return null;
    }
  }, [state.isSignedIn, portalUrl]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
