"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  arcgisUsername: string;
  displayName: string | null;
  thumbnailUrl: string | null;
  organization: {
    id: string;
    name: string;
  };
}

interface QuotaStatus {
  tier: string;
  mapsRemainingThisPeriod: number | null;
  bonusCreditsAvailable: number;
  totalMapsAvailable: number | null;
  canGenerate: boolean;
  isAtLimit: boolean;
}

interface AppHeaderProps {
  user: User;
  showAdminNav?: boolean;
  showSettingsNav?: boolean;
}

export function AppHeader({ user, showAdminNav = false, showSettingsNav = false }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch quota status
  const fetchQuotaStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/org/stats");
      if (response.ok) {
        const data = await response.json();
        setQuotaStatus(data);
      }
    } catch {
      // Ignore errors - stats are optional UI
    }
  }, []);

  useEffect(() => {
    fetchQuotaStatus();

    // Listen for events that should refresh quota stats
    const handleQuotaChange = () => {
      fetchQuotaStatus();
    };
    window.addEventListener("generation-complete", handleQuotaChange);
    window.addEventListener("quota-updated", handleQuotaChange);
    return () => {
      window.removeEventListener("generation-complete", handleQuotaChange);
      window.removeEventListener("quota-updated", handleQuotaChange);
    };
  }, [fetchQuotaStatus]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const displayName = user.displayName || user.arcgisUsername;

  return (
    <header className="border-b border-gray-200 bg-dark-bg">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <Link href="/app" className="flex items-center gap-3">
            <Image
              src="/images/logo-250.png"
              alt="dymaptic"
              width={120}
              height={34}
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* Right side: Usage stats + User menu */}
        <div className="flex items-center gap-4">
          {/* Usage stats */}
          {quotaStatus && (
            <div className="hidden text-sm text-gray-400 sm:block">
              {quotaStatus.totalMapsAvailable === null ? (
                <span className="font-medium text-white">Unlimited</span>
              ) : (
                <>
                  <span className="font-medium text-white">
                    {quotaStatus.mapsRemainingThisPeriod ?? 0}
                  </span>
                  {quotaStatus.tier === "FREE" ? " free" : ""} remaining
                  {quotaStatus.bonusCreditsAvailable > 0 && (
                    <span className="ml-2 text-coral">
                      +{quotaStatus.bonusCreditsAvailable} bonus
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-dark-bg-light"
            >
              {user.thumbnailUrl ? (
                <img
                  src={user.thumbnailUrl}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal-light">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden text-white sm:inline">{displayName}</span>
              <svg
                className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.organization.name}
                  </p>
                </div>
                <Link
                  href="/app"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Generate
                </Link>
                <Link
                  href="/history"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  History
                </Link>
                <Link
                  href="/help"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Help
                </Link>
                {showSettingsNav && (
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                )}
                {showAdminNav && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
