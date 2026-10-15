"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface QuotaStatus {
  tier: string;
  status: string;
  monthlyQuota: number | null;
  mapsUsedThisPeriod: number;
  mapsRemainingThisPeriod: number | null;
  bonusCreditsAvailable: number;
  totalMapsAvailable: number | null;
  canGenerate: boolean;
  isAtLimit: boolean;
  isApproachingLimit: boolean;
  limitMessage: string | null;
  periodEndDate: string | null;
}

interface QuotaDisplayProps {
  variant?: "compact" | "full";
  showUpgradeLink?: boolean;
}

export function QuotaDisplay({ variant = "compact", showUpgradeLink = true }: QuotaDisplayProps) {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchQuota = useCallback(async () => {
    try {
      const response = await fetch("/api/org/stats", {
        // Prevent caching so we always get fresh data
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setQuotaStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch quota:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when pathname changes (navigation between pages)
  useEffect(() => {
    fetchQuota();
  }, [fetchQuota, pathname]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </div>
    );
  }

  if (!quotaStatus) {
    return null;
  }

  const getTierLabel = () => {
    switch (quotaStatus.tier) {
      case "FREE":
        return "Free";
      case "STARTER":
        return "Starter";
      case "PROFESSIONAL":
        return "Professional";
      case "ENTERPRISE":
        return "Enterprise";
      default:
        return quotaStatus.tier;
    }
  };

  const getStatusBadge = () => {
    if (quotaStatus.status === "GRACE_PERIOD") {
      return (
        <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
          Grace Period
        </span>
      );
    }
    if (quotaStatus.status === "EXPIRED") {
      return (
        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
          Expired
        </span>
      );
    }
    return null;
  };

  const getUsagePercentage = () => {
    if (quotaStatus.monthlyQuota === null) return 0; // Unlimited
    return Math.round((quotaStatus.mapsUsedThisPeriod / quotaStatus.monthlyQuota) * 100);
  };

  const getUsageColor = () => {
    if (!quotaStatus.canGenerate) return "bg-red-500";
    if (quotaStatus.isApproachingLimit) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">
          {quotaStatus.tier === "FREE" ? (
            <>
              {quotaStatus.totalMapsAvailable === null
                ? "Unlimited"
                : `${quotaStatus.totalMapsAvailable} maps left`}
            </>
          ) : quotaStatus.monthlyQuota === null ? (
            "Unlimited"
          ) : (
            <>
              {quotaStatus.mapsRemainingThisPeriod ?? 0}
              {quotaStatus.bonusCreditsAvailable > 0 && (
                <span className="text-green-600"> +{quotaStatus.bonusCreditsAvailable}</span>
              )}
              {" maps left"}
            </>
          )}
        </span>
        {quotaStatus.isApproachingLimit && showUpgradeLink && (
          <a href="/settings" className="text-blue-600 hover:underline">
            Upgrade
          </a>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">
            {getTierLabel()} Plan
            {getStatusBadge()}
          </h3>
          {quotaStatus.periodEndDate && quotaStatus.tier !== "FREE" && (
            <p className="text-sm text-gray-500">
              Resets {new Date(quotaStatus.periodEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
        {showUpgradeLink && quotaStatus.tier !== "ENTERPRISE" && (
          <a
            href="/settings"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {quotaStatus.tier === "FREE" ? "Upgrade" : "Manage"}
          </a>
        )}
      </div>

      {/* Usage Bar */}
      {quotaStatus.monthlyQuota !== null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {quotaStatus.mapsUsedThisPeriod} / {quotaStatus.monthlyQuota} used
            </span>
            <span className="text-gray-500">{getUsagePercentage()}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full ${getUsageColor()} transition-all`}
              style={{ width: `${Math.min(100, getUsagePercentage())}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            {quotaStatus.tier === "FREE" ? "Free Maps" : "Monthly Quota"}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {quotaStatus.mapsRemainingThisPeriod === null
              ? "Unlimited"
              : quotaStatus.mapsRemainingThisPeriod}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs text-gray-500">Bonus Credits</p>
          <p className="text-lg font-semibold text-green-600">
            {quotaStatus.bonusCreditsAvailable}
          </p>
        </div>
      </div>

      {/* Warning/Error Messages */}
      {quotaStatus.limitMessage && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${
          quotaStatus.canGenerate
            ? "bg-yellow-50 text-yellow-700"
            : "bg-red-50 text-red-700"
        }`}>
          {quotaStatus.limitMessage}
        </div>
      )}

      {/* Approaching Limit Warning */}
      {quotaStatus.isApproachingLimit && !quotaStatus.limitMessage && (
        <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
          You&apos;re approaching your monthly limit.{" "}
          {quotaStatus.tier !== "ENTERPRISE" && (
            <a href="/settings" className="font-medium underline">
              Upgrade your plan
            </a>
          )}
        </div>
      )}
    </div>
  );
}
