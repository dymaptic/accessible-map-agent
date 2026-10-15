"use client";

import { useState, useEffect } from "react";
import { QuotaDisplay } from "@/components/QuotaDisplay";
import { SubscriptionRequestForm } from "@/components/SubscriptionRequestForm";
import { CancellationRequestForm } from "@/components/CancellationRequestForm";
import { AccessControlSettings } from "@/components/AccessControlSettings";
import { PLAN_CONFIG } from "@/lib/subscriptions";

interface SettingsContentProps {
  orgName: string;
}

interface OrgSettings {
  sharingOptIn: boolean;
  tier: string;
  status: string;
  billingFrequency: string | null;
  periodEndDate: string | null;
  scheduledDowngradeTier: string | null;
  scheduledDowngradeDate: string | null;
}

interface SubscriptionRequest {
  id: string;
  requestType: string;
  requestedTier: string;
  billingFrequency: string | null;
  status: string;
  createdAt: string;
}

export function SettingsContent({ orgName }: SettingsContentProps) {
  const [sharingOptIn, setSharingOptIn] = useState(false);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, requestsRes] = await Promise.all([
          fetch("/api/org/settings"),
          fetch("/api/subscription-requests"),
        ]);

        if (!settingsRes.ok) throw new Error("Failed to load settings");

        const settingsData = await settingsRes.json();
        setSharingOptIn(settingsData.sharingOptIn);
        setOrgSettings({
          sharingOptIn: settingsData.sharingOptIn,
          tier: settingsData.tier,
          status: settingsData.status,
          billingFrequency: settingsData.billingFrequency,
          periodEndDate: settingsData.periodEndDate,
          scheduledDowngradeTier: settingsData.scheduledDowngradeTier,
          scheduledDowngradeDate: settingsData.scheduledDowngradeDate,
        });

        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setSubscriptionRequests(requestsData.requests || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleToggle = async () => {
    const newValue = !sharingOptIn;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharingOptIn: newValue }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      setSharingOptIn(newValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionRequestSuccess = async () => {
    // Refresh the requests
    try {
      const requestsRes = await fetch("/api/subscription-requests");
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setSubscriptionRequests(requestsData.requests || []);
      }
    } catch {
      // Ignore
    }
    setShowRequestForm(false);
  };

  const handleCancellationSuccess = async () => {
    // Refresh the requests
    try {
      const requestsRes = await fetch("/api/subscription-requests");
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setSubscriptionRequests(requestsData.requests || []);
      }
    } catch {
      // Ignore
    }
    // Don't close form - show success message
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case "FREE":
        return "Free";
      case "STARTER":
        return "Starter";
      case "PROFESSIONAL":
        return "Professional";
      case "ENTERPRISE":
        return "Enterprise";
      default:
        return tier;
    }
  };

  const getStatusBadge = (status: string, isMostRecent: boolean = false) => {
    switch (status) {
      case "PENDING":
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">Pending</span>;
      case "INVOICED":
        return <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">Invoiced</span>;
      case "PAID":
        return <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">Paid - Awaiting Activation</span>;
      case "ACTIVATED":
        // Show "Current" for most recent activated, "Completed" for older ones
        return isMostRecent
          ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Current</span>
          : <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">Completed</span>;
      case "CANCELLED":
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">Cancelled</span>;
      default:
        return null;
    }
  };

  // Find the most recent activated request (to mark as "Current")
  const mostRecentActivatedId = subscriptionRequests.find(r => r.status === "ACTIVATED")?.id;

  const hasPendingRequest = subscriptionRequests.some(
    (r) => (r.status === "PENDING" || r.status === "INVOICED" || r.status === "PAID") && r.requestType !== "CANCELLATION"
  );

  const hasPendingCancellation = subscriptionRequests.some(
    (r) => (r.status === "PENDING" || r.status === "INVOICED") && r.requestType === "CANCELLATION"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Settings for {orgName}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Subscription & Quota Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Subscription & Usage</h2>

          {/* Current Plan */}
          <div className="mt-4">
            <QuotaDisplay variant="full" showUpgradeLink={false} />
          </div>

          {/* Scheduled Downgrade Notice */}
          {orgSettings?.scheduledDowngradeTier && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-medium text-amber-900">Scheduled Plan Change</h3>
              <p className="mt-1 text-sm text-amber-700">
                Your subscription will change to{" "}
                <span className="font-medium">{getTierDisplayName(orgSettings.scheduledDowngradeTier)}</span>{" "}
                on{" "}
                <span className="font-medium">
                  {orgSettings.scheduledDowngradeDate
                    ? new Date(orgSettings.scheduledDowngradeDate).toLocaleDateString()
                    : orgSettings.periodEndDate
                    ? new Date(orgSettings.periodEndDate).toLocaleDateString()
                    : "your next billing date"}
                </span>
                . Until then, you have full access to your current plan.
              </p>
              <p className="mt-2 text-sm text-amber-600">
                To cancel this change, please{" "}
                <a href="mailto:support@dymaptic.com" className="font-medium underline">
                  contact support
                </a>
                .
              </p>
            </div>
          )}

          {/* Pending Subscription Request */}
          {hasPendingRequest && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900">Subscription Request in Progress</h3>
              <p className="mt-1 text-sm text-blue-700">
                You have a subscription request being processed. You&apos;ll receive an invoice at
                your billing email address.
              </p>
              <div className="mt-3 space-y-2">
                {subscriptionRequests
                  .filter((r) => ["PENDING", "INVOICED", "PAID"].includes(r.status))
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg bg-white p-3"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {getTierDisplayName(request.requestedTier)}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{request.billingFrequency}</span>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Upgrade/Change Plan Buttons */}
          {orgSettings?.tier !== "ENTERPRISE" && !hasPendingRequest && !showRequestForm && !showCancellationForm && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setShowRequestForm(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {orgSettings?.tier === "FREE" ? "Upgrade Your Plan" : "Change Plan"}
              </button>
              {orgSettings?.tier !== "FREE" && !hasPendingCancellation && (
                <button
                  onClick={() => setShowCancellationForm(true)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          )}

          {/* Pending Cancellation Notice */}
          {hasPendingCancellation && !showCancellationForm && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-medium text-amber-900">Cancellation Request Pending</h3>
              <p className="mt-1 text-sm text-amber-700">
                Your cancellation request is being processed. We&apos;ll contact you to confirm the details.
              </p>
            </div>
          )}

          {/* Enterprise contact for changes */}
          {orgSettings?.tier === "ENTERPRISE" && !hasPendingRequest && !showCancellationForm && (
            <div className="mt-4 flex flex-wrap gap-3">
              <p className="text-sm text-gray-600">
                To modify your Enterprise subscription, please contact{" "}
                <a href="mailto:support@dymaptic.com" className="text-blue-600 hover:underline">
                  support@dymaptic.com
                </a>
              </p>
              {!hasPendingCancellation && (
                <button
                  onClick={() => setShowCancellationForm(true)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          )}

          {/* Cancellation Request Form */}
          {showCancellationForm && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Cancel Subscription</h3>
              <CancellationRequestForm
                onSuccess={handleCancellationSuccess}
                onCancel={() => setShowCancellationForm(false)}
                currentTier={getTierDisplayName(orgSettings?.tier || "FREE")}
              />
            </div>
          )}

          {/* Subscription Request Form */}
          {showRequestForm && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Request Subscription</h3>
              <SubscriptionRequestForm
                onSuccess={handleSubscriptionRequestSuccess}
                onCancel={() => setShowRequestForm(false)}
                defaultTier={orgSettings?.tier === "FREE" ? "STARTER" : "PROFESSIONAL"}
                defaultFrequency="ANNUAL"
              />
            </div>
          )}

          {/* Pricing Info */}
          {orgSettings?.tier === "FREE" && !showRequestForm && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900">Available Plans</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const).map((tier) => {
                  const config = PLAN_CONFIG[tier];
                  return (
                    <div key={tier} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="font-medium text-gray-900">{config.displayName}</div>
                      <div className="text-sm text-gray-500">
                        {config.monthlyQuota === null
                          ? "Unlimited"
                          : `${config.monthlyQuota} maps/month`}
                      </div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        {config.monthlyPrice === null
                          ? "Custom"
                          : `$${config.monthlyPrice}/mo`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Past Subscription Requests */}
        {subscriptionRequests.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
            <p className="mt-1 text-sm text-gray-500">Previous subscription and cancellation requests</p>
            <div className="mt-4 space-y-3">
              {subscriptionRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div>
                    {request.requestType === "CANCELLATION" ? (
                      <span className="font-medium text-gray-900">Cancellation Request</span>
                    ) : (
                      <>
                        <span className="font-medium text-gray-900">
                          {getTierDisplayName(request.requestedTier)}
                        </span>
                        {request.billingFrequency && (
                          <>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{request.billingFrequency}</span>
                          </>
                        )}
                      </>
                    )}
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {getStatusBadge(request.status, request.id === mostRecentActivatedId)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Control Section (shows for all tiers, disabled for non-Enterprise) */}
        <AccessControlSettings currentTier={orgSettings?.tier || "FREE"} />

        {/* Quality Sharing Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Help Improve Accessibility
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Allow your map descriptions to be used anonymously to improve our
                AI model&apos;s understanding of GIS data and accessibility needs.
              </p>
              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <h3 className="text-sm font-medium text-blue-900">
                  What this means:
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Map screenshots and descriptions may be reviewed by our team
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Used to improve AI quality for all accessibility users
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Your organization name is never associated with shared data
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>You can opt out at any time</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Toggle */}
            <div className="ml-6 flex-shrink-0">
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  sharingOptIn ? "bg-blue-600" : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={sharingOptIn}
              >
                <span className="sr-only">Enable quality sharing</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sharingOptIn ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-2">
            {saving ? (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2 text-sm text-green-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Settings saved
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                Currently{" "}
                <span className={sharingOptIn ? "text-green-600 font-medium" : "text-gray-700"}>
                  {sharingOptIn ? "opted in" : "opted out"}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
