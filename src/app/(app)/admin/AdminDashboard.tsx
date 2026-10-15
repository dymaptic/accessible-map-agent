"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Organization {
  id: string;
  arcgisOrgId: string;
  name: string;
  tier: string;
  tierDisplayName: string;
  status: string;
  userCount: number;
  mapsUsedThisPeriod: number;
  mapsRemainingThisPeriod: number | null;
  bonusCreditsAvailable: number;
  totalMapsAvailable: number | null;
  canGenerate: boolean;
  createdAt: string;
}

interface BonusCredit {
  id: string;
  creditsGranted: number;
  creditsRemaining: number;
  grantDate: string;
  expirationDate: string;
  grantReason: string;
  grantedBy: string;
  notes: string | null;
}

interface OrgDetails {
  id: string;
  arcgisOrgId: string;
  name: string;
  tier: string;
  tierDisplayName: string;
  status: string;
  billingFrequency: string | null;
  monthlyQuota: number | null;
  periodEndDate: string | null;
  subscriptionEndDate: string | null;
  scheduledDowngradeTier: string | null;
  scheduledDowngradeDate: string | null;
  createdAt: string;
  users: Array<{
    id: string;
    arcgisUsername: string;
    displayName: string | null;
    email: string | null;
    isOrgAdmin: boolean;
    lastLoginAt: string;
  }>;
  bonusCredits: BonusCredit[];
  quotaStatus: {
    mapsUsedThisPeriod: number;
    mapsRemainingThisPeriod: number | null;
    bonusCreditsAvailable: number;
    totalMapsAvailable: number | null;
    canGenerate: boolean;
    isAtLimit: boolean;
    isApproachingLimit: boolean;
    limitMessage: string | null;
  };
  stats: {
    recentGenerationsCount: number;
    totalGenerationsAllTime: number;
  };
}

interface SubscriptionFormData {
  action: string;
  tier: string;
  billingFrequency: string;
  notes: string;
  downgradeDate: string; // ISO date string for schedule_downgrade
  customMonthlyQuota?: string; // For Enterprise tier - empty string = unlimited
}

interface SubscriptionRequest {
  id: string;
  organization: {
    id: string;
    name: string;
    arcgisOrgId: string;
    tier: string;
  };
  requestingUser: {
    arcgisUsername: string;
    displayName: string | null;
    email: string | null;
  };
  requestType?: string;
  requestedTier: string;
  billingFrequency: string | null;
  billingContactName: string;
  billingContactEmail: string;
  billingAddress: string | null;
  poNumber: string | null;
  specialRequirements: string | null;
  status: string;
  createdAt: string;
  processedBy: string | null;
}

interface AdminDashboardProps {
  adminUsername: string;
}

export function AdminDashboard({ adminUsername }: AdminDashboardProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrgDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Bonus credit form state
  const [creditOrgId, setCreditOrgId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [creditReason, setCreditReason] = useState("admin_grant");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subscription management state
  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionFormData>({
    action: "activate",
    tier: "STARTER",
    billingFrequency: "ANNUAL",
    notes: "",
    downgradeDate: "",
    customMonthlyQuota: "",
  });
  const [subscriptionSubmitting, setSubscriptionSubmitting] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subscription requests state
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsFilter, setRequestsFilter] = useState<string>("PENDING");

  // Ref for scrolling to subscription form
  const subscriptionFormRef = useRef<HTMLDivElement>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const response = await fetch(`/api/admin/organizations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchSubscriptionRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const params = new URLSearchParams();
      if (requestsFilter && requestsFilter !== "ALL") {
        params.set("status", requestsFilter);
      }
      const response = await fetch(`/api/admin/subscription-requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptionRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch subscription requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  }, [requestsFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchOrganizations, 300);
    return () => clearTimeout(debounce);
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchSubscriptionRequests();
  }, [fetchSubscriptionRequests]);

  const fetchOrgDetails = async (orgId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrg(data);
        // Set sensible default action based on org tier
        const defaultAction = data.tier === "FREE" ? "activate" :
          data.scheduledDowngradeTier ? "cancel_scheduled_downgrade" :
          "schedule_downgrade";
        const defaultTier = data.tier === "FREE" ? "STARTER" :
          data.tier === "STARTER" ? "FREE" :
          data.tier === "PROFESSIONAL" ? "STARTER" : "PROFESSIONAL";
        // Default downgrade date: subscriptionEndDate (annual) > periodEndDate > today
        const defaultDowngradeDate = data.subscriptionEndDate
          ? new Date(data.subscriptionEndDate).toISOString().split("T")[0]
          : data.periodEndDate
          ? new Date(data.periodEndDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        // Pre-fill current quota for Enterprise orgs
        const currentQuota = data.tier === "ENTERPRISE" && data.monthlyQuota
          ? String(data.monthlyQuota)
          : "";
        setSubscriptionForm({
          action: defaultAction,
          tier: defaultTier,
          billingFrequency: data.billingFrequency || "ANNUAL",
          notes: "",
          downgradeDate: defaultDowngradeDate,
          customMonthlyQuota: currentQuota,
        });
      }
    } catch (error) {
      console.error("Failed to fetch org details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddBonusCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/allotments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: creditOrgId,
          amount: parseInt(creditAmount, 10),
          notes: creditNotes || null,
          reason: creditReason,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Bonus credits added successfully!" });
        setCreditOrgId("");
        setCreditAmount("");
        setCreditNotes("");
        setCreditReason("admin_grant");
        fetchOrganizations();
        if (selectedOrg?.id === creditOrgId) {
          fetchOrgDetails(creditOrgId);
        }
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to add bonus credits" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to add bonus credits" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBonusCredit = async (creditId: string) => {
    if (!confirm("Are you sure you want to delete this bonus credit?")) return;

    try {
      const response = await fetch(`/api/admin/allotments/${creditId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchOrganizations();
        if (selectedOrg) {
          fetchOrgDetails(selectedOrg.id);
        }
      }
    } catch (error) {
      console.error("Failed to delete bonus credit:", error);
    }
  };

  const handleProcessRequest = async (request: SubscriptionRequest) => {
    // Fetch org details first
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/organizations/${request.organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrg(data);

        // Default downgrade date: subscriptionEndDate (annual) > periodEndDate > today
        const defaultDowngradeDate = data.subscriptionEndDate
          ? new Date(data.subscriptionEndDate).toISOString().split("T")[0]
          : data.periodEndDate
          ? new Date(data.periodEndDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        // Pre-fill the form based on request type
        // NEW = Free → Paid (activate)
        // UPGRADE = Lower tier → Higher tier (activate)
        // DOWNGRADE = Higher tier → Lower tier (schedule_downgrade)
        // CANCELLATION = Any → Free (schedule_downgrade to FREE)
        const requestType = request.requestType || "NEW";

        if (requestType === "CANCELLATION") {
          // For cancellation, set up schedule_downgrade to FREE
          setSubscriptionForm({
            action: "schedule_downgrade",
            tier: "FREE",
            billingFrequency: "ANNUAL",
            notes: `Processing cancellation request from ${request.billingContactName}`,
            downgradeDate: defaultDowngradeDate,
            customMonthlyQuota: "",
          });
        } else if (requestType === "DOWNGRADE") {
          // For downgrade, set up schedule_downgrade to the requested tier
          setSubscriptionForm({
            action: "schedule_downgrade",
            tier: request.requestedTier,
            billingFrequency: request.billingFrequency || "ANNUAL",
            notes: request.poNumber ? `PO: ${request.poNumber}` : "",
            downgradeDate: defaultDowngradeDate,
            customMonthlyQuota: "",
          });
        } else {
          // For NEW or UPGRADE requests, set up activate
          setSubscriptionForm({
            action: "activate",
            tier: request.requestedTier,
            billingFrequency: request.billingFrequency || "ANNUAL",
            notes: request.poNumber ? `PO: ${request.poNumber}` : "",
            downgradeDate: defaultDowngradeDate,
            customMonthlyQuota: "",
          });
        }

        // Scroll to the form after a short delay to allow rendering
        setTimeout(() => {
          subscriptionFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    } catch (error) {
      console.error("Failed to fetch org details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubscriptionAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setSubscriptionSubmitting(true);
    setSubscriptionMessage(null);

    try {
      // Prepare form data, converting customMonthlyQuota to number or null
      const formData = {
        ...subscriptionForm,
        customMonthlyQuota: subscriptionForm.customMonthlyQuota
          ? parseInt(subscriptionForm.customMonthlyQuota, 10)
          : null,
      };

      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubscriptionMessage({ type: "success", text: "Subscription updated successfully!" });
        setSubscriptionForm({ ...subscriptionForm, notes: "", customMonthlyQuota: "" });
        fetchOrganizations();
        fetchOrgDetails(selectedOrg.id);
        fetchSubscriptionRequests(); // Refresh requests so processed ones disappear
      } else {
        const data = await response.json();
        setSubscriptionMessage({ type: "error", text: data.error || "Failed to update subscription" });
      }
    } catch {
      setSubscriptionMessage({ type: "error", text: "Failed to update subscription" });
    } finally {
      setSubscriptionSubmitting(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "FREE":
        return "bg-gray-100 text-gray-700";
      case "STARTER":
        return "bg-blue-100 text-blue-700";
      case "PROFESSIONAL":
        return "bg-purple-100 text-purple-700";
      case "ENTERPRISE":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "GRACE_PERIOD":
        return "bg-yellow-100 text-yellow-700";
      case "EXPIRED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRequestStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "ACTIVATED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-700">
          Logged in as {adminUsername}
        </p>
      </div>

      {/* Subscription Requests Section */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Subscription Requests</h2>
            <div className="flex items-center gap-2">
              <select
                value={requestsFilter}
                onChange={(e) => setRequestsFilter(e.target.value)}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="PENDING">Pending</option>
                <option value="ACTIVATED">Activated</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ALL">All</option>
              </select>
              <button
                onClick={fetchSubscriptionRequests}
                className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {loadingRequests ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : subscriptionRequests.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              No {requestsFilter !== "ALL" ? requestsFilter.toLowerCase() : ""} subscription requests
            </p>
          ) : (
            <div className="space-y-3">
              {subscriptionRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-lg border border-gray-200 p-4 hover:border-gray-300"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{req.organization.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${getRequestStatusBadgeColor(req.status)}`}>
                          {req.status}
                        </span>
                        {req.requestType === "CANCELLATION" && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                            Cancellation
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {req.requestType === "CANCELLATION" ? (
                          <>Cancellation requested by {req.requestingUser.displayName || req.requestingUser.arcgisUsername}</>
                        ) : (
                          <>
                            Requesting <strong>{req.requestedTier}</strong>
                            {req.billingFrequency && ` (${req.billingFrequency.toLowerCase()})`}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Contact</p>
                      <p className="text-gray-900">{req.billingContactName}</p>
                      <p className="text-gray-600">{req.billingContactEmail}</p>
                    </div>
                    {req.billingAddress && (
                      <div>
                        <p className="text-gray-500">Billing Address</p>
                        <p className="whitespace-pre-line text-gray-900">{req.billingAddress}</p>
                      </div>
                    )}
                  </div>

                  {(req.poNumber || req.specialRequirements) && (
                    <div className="mt-2 text-sm">
                      {req.poNumber && (
                        <p className="text-gray-600">
                          <span className="text-gray-500">PO:</span> {req.poNumber}
                        </p>
                      )}
                      {req.specialRequirements && (
                        <p className="text-gray-600">
                          <span className="text-gray-500">Notes:</span> {req.specialRequirements}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    {req.processedBy ? (
                      <p className="text-xs text-gray-500">
                        Processed by {req.processedBy}
                      </p>
                    ) : (
                      <div />
                    )}
                    {req.status === "PENDING" && (
                      <button
                        onClick={() => handleProcessRequest(req)}
                        className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        {req.requestType === "CANCELLATION" ? "Process Cancellation" : "Process & Activate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Organizations List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
            <span className="text-sm text-gray-500">{organizations.length} total</span>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-500">No organizations found</p>
              </div>
            ) : (
              organizations.map((org) => (
                <div
                  key={org.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    selectedOrg?.id === org.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => fetchOrgDetails(org.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{org.name}</h3>
                      <p className="text-xs text-gray-500">{org.arcgisOrgId}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${getTierBadgeColor(org.tier)}`}>
                        {org.tierDisplayName}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {org.userCount} users
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span className="text-gray-600">
                      {org.tier === "FREE" ? (
                        `Free: ${org.mapsUsedThisPeriod}/3 used`
                      ) : org.mapsRemainingThisPeriod === null ? (
                        "Unlimited quota"
                      ) : (
                        `Quota: ${org.mapsRemainingThisPeriod} remaining`
                      )}
                    </span>
                    {org.bonusCreditsAvailable > 0 && (
                      <span className="text-green-600">
                        +{org.bonusCreditsAvailable} bonus
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Details + Add Bonus Credits */}
        <div className="space-y-6">
          {/* Organization Details */}
          {selectedOrg && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedOrg.name}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedOrg.arcgisOrgId}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${getTierBadgeColor(selectedOrg.tier)}`}>
                      {selectedOrg.tierDisplayName}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeColor(selectedOrg.status)}`}>
                      {selectedOrg.status}
                    </span>
                  </div>
                </div>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                <div className="p-6">
                  {/* Quota Stats */}
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        {selectedOrg.tier === "FREE" ? "Free Used" : "Period Used"}
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {selectedOrg.quotaStatus.mapsUsedThisPeriod}
                        {selectedOrg.tier === "FREE" ? "/3" : selectedOrg.monthlyQuota ? `/${selectedOrg.monthlyQuota}` : ""}
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <p className="text-xs text-gray-500">Bonus Credits</p>
                      <p className="text-xl font-semibold text-green-600">
                        {selectedOrg.quotaStatus.bonusCreditsAvailable}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-xs text-gray-500">Total All-Time</p>
                      <p className="text-xl font-semibold text-blue-600">
                        {selectedOrg.stats.totalGenerationsAllTime.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  {selectedOrg.tier !== "FREE" && (
                    <div className="mb-6 rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-2 text-sm font-medium text-gray-900">Subscription Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Billing:</span>{" "}
                          <span className="text-gray-900">{selectedOrg.billingFrequency || "N/A"}</span>
                        </div>
                        {selectedOrg.periodEndDate && (
                          <div>
                            <span className="text-gray-500">Period ends:</span>{" "}
                            <span className="text-gray-900">
                              {new Date(selectedOrg.periodEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Scheduled Downgrade Notice */}
                      {selectedOrg.scheduledDowngradeTier && (
                        <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2">
                          <p className="text-sm text-amber-800">
                            <span className="font-medium">Scheduled change:</span>{" "}
                            Will downgrade to {selectedOrg.scheduledDowngradeTier} on{" "}
                            {selectedOrg.scheduledDowngradeDate
                              ? new Date(selectedOrg.scheduledDowngradeDate).toLocaleDateString()
                              : "period end"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Users */}
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium text-gray-900">
                      Users ({selectedOrg.users.length})
                    </h3>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {selectedOrg.users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between rounded bg-gray-100 px-3 py-2 text-sm"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{user.displayName || user.arcgisUsername}</span>
                            {user.isOrgAdmin && (
                              <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-600">
                            {new Date(user.lastLoginAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bonus Credits */}
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-900">
                      Active Bonus Credits ({selectedOrg.bonusCredits.length})
                    </h3>
                    {selectedOrg.bonusCredits.length === 0 ? (
                      <p className="text-sm text-gray-500">No active bonus credits</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedOrg.bonusCredits.map((credit) => (
                          <div
                            key={credit.id}
                            className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {credit.creditsRemaining}/{credit.creditsGranted} remaining
                              </p>
                              <p className="text-xs text-gray-500">
                                Expires: {new Date(credit.expirationDate).toLocaleDateString()}
                                {" • "}{credit.grantReason.replace("_", " ")}
                                {credit.notes && ` • ${credit.notes}`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteBonusCredit(credit.id)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subscription Management */}
                  <div ref={subscriptionFormRef} className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="mb-3 text-sm font-medium text-gray-900">
                      Manage Subscription
                    </h3>

                    {subscriptionMessage && (
                      <div
                        className={`mb-3 rounded-lg p-2 text-sm ${
                          subscriptionMessage.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {subscriptionMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleSubscriptionAction} className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Action
                        </label>
                        <select
                          value={subscriptionForm.action}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, action: e.target.value })}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                        >
                          {/* Context-aware options based on current tier */}
                          {selectedOrg.tier === "FREE" && (
                            <option value="activate">Activate Paid Subscription</option>
                          )}
                          {selectedOrg.tier !== "FREE" && selectedOrg.tier !== "ENTERPRISE" && (
                            <option value="activate">Upgrade</option>
                          )}
                          {selectedOrg.tier !== "FREE" && (
                            <>
                              <option value="schedule_downgrade">Schedule Downgrade (at period end)</option>
                              <option value="cancel">Cancel Immediately (to Free)</option>
                            </>
                          )}
                          {selectedOrg.scheduledDowngradeTier && (
                            <option value="cancel_scheduled_downgrade">Cancel Scheduled Downgrade</option>
                          )}
                          <option value="reset_quota">Reset Monthly Quota</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          {subscriptionForm.action === "activate" && selectedOrg.tier === "FREE" && (
                            "Activates a paid subscription immediately. Resets quota and billing period to today."
                          )}
                          {subscriptionForm.action === "activate" && selectedOrg.tier !== "FREE" && (
                            "Upgrades to a higher tier immediately. Resets quota and billing period to today."
                          )}
                          {subscriptionForm.action === "schedule_downgrade" && (
                            "Schedules a downgrade to take effect at the end of the current period. Customer keeps access until then."
                          )}
                          {subscriptionForm.action === "cancel" && (
                            "Immediately reverts to Free tier. Use only for special cases - normally use Schedule Downgrade."
                          )}
                          {subscriptionForm.action === "cancel_scheduled_downgrade" && (
                            "Cancels the pending downgrade. Customer will continue on their current plan."
                          )}
                          {subscriptionForm.action === "reset_quota" && (
                            "Resets period usage to 0 without changing subscription tier."
                          )}
                        </p>
                      </div>

                      {/* Tier selection for activate/upgrade */}
                      {subscriptionForm.action === "activate" && (
                        <>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                              New Tier
                            </label>
                            <select
                              value={subscriptionForm.tier}
                              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, tier: e.target.value })}
                              className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                            >
                              {/* Only show tiers higher than current */}
                              {(selectedOrg.tier === "FREE" || selectedOrg.tier === "STARTER") && (
                                <option value="STARTER">Starter ($49/mo or $499/yr)</option>
                              )}
                              {(selectedOrg.tier === "FREE" || selectedOrg.tier === "STARTER" || selectedOrg.tier === "PROFESSIONAL") && (
                                <option value="PROFESSIONAL">Professional ($199/mo or $1,999/yr)</option>
                              )}
                              <option value="ENTERPRISE">Enterprise (Custom)</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                              Billing Frequency
                            </label>
                            <select
                              value={subscriptionForm.billingFrequency}
                              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, billingFrequency: e.target.value })}
                              className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="MONTHLY">Monthly</option>
                              <option value="ANNUAL">Annual</option>
                            </select>
                          </div>

                          {/* Custom quota for Enterprise tier */}
                          {subscriptionForm.tier === "ENTERPRISE" && (
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Monthly Quota
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={subscriptionForm.customMonthlyQuota || ""}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, customMonthlyQuota: e.target.value })}
                                placeholder="Leave empty for unlimited"
                                className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Maps per billing period. Leave empty for unlimited.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Tier selection for schedule_downgrade */}
                      {subscriptionForm.action === "schedule_downgrade" && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Downgrade To
                          </label>
                          <select
                            value={subscriptionForm.tier}
                            onChange={(e) => setSubscriptionForm({ ...subscriptionForm, tier: e.target.value })}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                          >
                            {/* Only show tiers lower than current */}
                            <option value="FREE">Free</option>
                            {(selectedOrg.tier === "PROFESSIONAL" || selectedOrg.tier === "ENTERPRISE") && (
                              <option value="STARTER">Starter</option>
                            )}
                            {selectedOrg.tier === "ENTERPRISE" && (
                              <option value="PROFESSIONAL">Professional</option>
                            )}
                          </select>
                        </div>
                      )}

                      {/* Effective date for schedule_downgrade */}
                      {subscriptionForm.action === "schedule_downgrade" && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Effective Date
                          </label>
                          <input
                            type="date"
                            value={subscriptionForm.downgradeDate}
                            onChange={(e) => setSubscriptionForm({ ...subscriptionForm, downgradeDate: e.target.value })}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {selectedOrg.subscriptionEndDate
                              ? `Subscription ends: ${new Date(selectedOrg.subscriptionEndDate).toLocaleDateString()}`
                              : selectedOrg.periodEndDate
                              ? `Period ends: ${new Date(selectedOrg.periodEndDate).toLocaleDateString()}`
                              : "No subscription end date set"}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={subscriptionForm.notes}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, notes: e.target.value })}
                          placeholder="Invoice #, reason, etc."
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={subscriptionSubmitting}
                        className={`w-full rounded px-3 py-2 text-sm font-medium text-white transition-colors ${
                          subscriptionForm.action === "cancel"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        } disabled:bg-gray-300`}
                      >
                        {subscriptionSubmitting ? "Processing..." : (
                          subscriptionForm.action === "activate" ? (selectedOrg.tier === "FREE" ? "Activate Subscription" : "Upgrade Subscription") :
                          subscriptionForm.action === "schedule_downgrade" ? "Schedule Downgrade" :
                          subscriptionForm.action === "cancel" ? "Cancel Immediately" :
                          subscriptionForm.action === "cancel_scheduled_downgrade" ? "Cancel Scheduled Downgrade" :
                          "Reset Quota"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Bonus Credits Form */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Add Bonus Credits
            </h2>

            {message && (
              <div
                className={`mb-4 rounded-lg p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleAddBonusCredit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <select
                  value={creditOrgId}
                  onChange={(e) => setCreditOrgId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  required
                  placeholder="10"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <select
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="admin_grant">Admin Grant</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="promotional">Promotional</option>
                  <option value="subscription_request">Subscription Request</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  placeholder="Invoice #1234, Conference promo, etc."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
              >
                {submitting ? "Adding..." : "Grant Bonus Credits"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
