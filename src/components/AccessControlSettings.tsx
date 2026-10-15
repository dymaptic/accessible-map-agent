"use client";

import { useState, useEffect } from "react";
import { GroupMultiSelect } from "./GroupMultiSelect";

interface Group {
  id: string;
  title: string;
  memberCount?: number;
}

interface ApiGroup {
  id: string;
  title?: string;
  name?: string;
  memberCount?: number;
}

interface AccessSettings {
  accessRestrictionEnabled: boolean;
  accessGroups: ApiGroup[];
  removedGroups: ApiGroup[];
  isEnterprise: boolean;
  warning?: string;
}

interface AccessControlSettingsProps {
  currentTier: string;
}

export function AccessControlSettings({ currentTier }: AccessControlSettingsProps) {
  const isEnterprise = currentTier === "ENTERPRISE";
  const [settings, setSettings] = useState<AccessSettings | null>(null);
  const [loading, setLoading] = useState(isEnterprise);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Local state for form
  const [enabled, setEnabled] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [showRemovedNotice, setShowRemovedNotice] = useState(true);

  // Fetch current settings (only for Enterprise)
  useEffect(() => {
    if (!isEnterprise) return;

    async function fetchSettings() {
      try {
        const response = await fetch("/api/org/access-settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data: AccessSettings = await response.json();
        setSettings(data);
        setEnabled(data.accessRestrictionEnabled);
        // Normalize groups to have a consistent shape
        setSelectedGroups(
          data.accessGroups.map(g => ({
            id: g.id,
            title: g.name || g.title || "Unknown Group",
            memberCount: g.memberCount,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [isEnterprise]);

  const handleSave = async () => {
    if (!isEnterprise) return;

    setError(null);
    setSuccess(false);

    // Validation: if enabling, must have at least one group
    if (enabled && selectedGroups.length === 0) {
      setError("Please select at least one group or disable access restrictions");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/org/access-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessRestrictionEnabled: enabled,
          accessGroupIds: enabled ? selectedGroups.map(g => g.id) : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      // Update the saved settings state so hasChanges becomes false
      setSettings(prev =>
        prev
          ? {
              ...prev,
              accessRestrictionEnabled: enabled,
              accessGroups: selectedGroups.map(g => ({
                id: g.id,
                title: g.title,
                memberCount: g.memberCount,
              })),
            }
          : prev
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasChanges =
    isEnterprise &&
    settings &&
    (enabled !== settings.accessRestrictionEnabled ||
      JSON.stringify(selectedGroups.map(g => g.id).sort()) !==
        JSON.stringify(settings.accessGroups.map(g => g.id).sort()));

  // Loading state (only for Enterprise)
  if (isEnterprise && loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-white p-6 ${isEnterprise ? "border-gray-200" : "border-gray-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Access Control
            <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              Enterprise
            </span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Control which users in your organization can access Accessible Map Agent.
          </p>
        </div>
        {!isEnterprise && (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
          </span>
        )}
      </div>

      {/* Upgrade prompt for non-Enterprise */}
      {!isEnterprise && (
        <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-purple-900">Enterprise Feature</h3>
              <p className="mt-1 text-sm text-purple-700">
                Restrict app access to specific ArcGIS groups within your organization.
                Perfect for departments that need to control who can use their allocation.
              </p>
              <a
                href="mailto:support@dymaptic.com?subject=Enterprise%20Upgrade%20Inquiry"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-900"
              >
                Contact us about Enterprise
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Show disabled preview for non-Enterprise */}
      {!isEnterprise && (
        <div className="mt-6 space-y-6 opacity-50 pointer-events-none" aria-hidden="true">
          {/* Disabled toggle preview */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">
                Restrict access to specific groups
              </span>
              <p className="text-sm text-gray-500">
                When enabled, only users in the selected groups can access the app.
              </p>
            </div>
            <div
              className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-gray-200"
            >
              <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0" />
            </div>
          </div>

          {/* Disabled info box */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-blue-800">
                Users who are members of <strong>any</strong> selected group, plus organization
                administrators, will be able to access the app.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active content for Enterprise */}
      {isEnterprise && (
        <>
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Removed groups notice */}
          {settings?.removedGroups && settings.removedGroups.length > 0 && showRemovedNotice && (
            <div className="mt-4 flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Some groups no longer exist</p>
                  <p className="mt-1">
                    The following groups were removed:{" "}
                    {settings.removedGroups.map(g => g.name || g.title).join(", ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRemovedNotice(false)}
                className="text-amber-600 hover:text-amber-800"
                aria-label="Dismiss notice"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="mt-6 space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="access-restriction-toggle" className="font-medium text-gray-900">
                  Restrict access to specific groups
                </label>
                <p className="text-sm text-gray-500">
                  When enabled, only users in the selected groups can access the app.
                </p>
              </div>
              <button
                id="access-restriction-toggle"
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={enabled}
              >
                <span className="sr-only">Enable access restrictions</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Group selection (shown when enabled) */}
            {enabled && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="block font-medium text-gray-900">
                  Authorized Groups
                </label>
                <p className="mb-3 text-sm text-gray-500">
                  Select the ArcGIS groups whose members can access the app.
                </p>
                <GroupMultiSelect
                  selectedGroups={selectedGroups}
                  onSelectionChange={setSelectedGroups}
                />
              </div>
            )}

            {/* Info box */}
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-blue-800">
                  Users who are members of <strong>any</strong> selected group, plus organization
                  administrators, will be able to access the app. Other users will see an access
                  denied message when they try to sign in.
                </p>
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div>
                {success && (
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
                )}
                {hasChanges && !success && (
                  <span className="text-sm text-amber-600">You have unsaved changes</span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
