"use client";

import { useState, useEffect, useCallback } from "react";
import { useArcGISAuth } from "@/components/auth/ArcGISAuthProvider";

type TabType = "my-content" | "org" | "public";

interface PortalItem {
  id: string;
  title: string;
  snippet: string | null;
  thumbnailUrl: string | null;
  owner: string;
  modified: number;
}

interface MapPickerProps {
  username: string;
  orgId: string;
  selectedMapId: string | null;
  onSelectMap: (mapId: string, title: string) => void;
}

export function MapPicker({
  username,
  orgId,
  selectedMapId,
  onSelectMap,
}: MapPickerProps) {
  const { getToken } = useArcGISAuth();
  const [activeTab, setActiveTab] = useState<TabType>("my-content");
  const [searchQuery, setSearchQuery] = useState("");
  const [maps, setMaps] = useState<PortalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get fresh token from IdentityManager
      const accessToken = await getToken();
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      // Build query based on active tab
      let query = 'type:"Web Map" -type:"Web Mapping Application"';

      if (activeTab === "my-content") {
        query += ` owner:${username}`;
      } else if (activeTab === "org") {
        query += ` orgid:${orgId}`;
      }
      // "public" tab searches all public maps

      if (searchQuery.trim()) {
        query += ` ${searchQuery}`;
      }

      const params = new URLSearchParams({
        q: query,
        f: "json",
        token: accessToken,
        num: "50",
        sortField: "modified",
        sortOrder: "desc",
      });

      const response = await fetch(
        `https://www.arcgis.com/sharing/rest/search?${params}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Failed to search maps");
      }

      // Get fresh token again for thumbnail URLs (in case the first one took time)
      const thumbnailToken = await getToken();

      const items: PortalItem[] = (data.results || []).map(
        (item: {
          id: string;
          title: string;
          snippet?: string;
          thumbnail?: string;
          owner: string;
          modified: number;
        }) => ({
          id: item.id,
          title: item.title,
          snippet: item.snippet || null,
          thumbnailUrl: item.thumbnail
            ? `https://www.arcgis.com/sharing/rest/content/items/${item.id}/info/${item.thumbnail}?token=${thumbnailToken}`
            : null,
          owner: item.owner,
          modified: item.modified,
        })
      );

      setMaps(items);
    } catch (err) {
      console.error("Error fetching maps:", err);
      setError("Failed to load maps");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, getToken, username, orgId]);

  // Fetch maps when tab or search changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchMaps();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchMaps]);

  const tabs: { id: TabType; label: string }[] = [
    { id: "my-content", label: "My Content" },
    { id: "org", label: "Organization" },
    { id: "public", label: "Public" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Search input */}
      <div className="px-4 pb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search maps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-coral text-coral"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Map list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-coral border-t-transparent" />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-coral">{error}</p>
            <button
              onClick={fetchMaps}
              className="mt-2 text-sm text-teal hover:underline"
            >
              Try again
            </button>
          </div>
        ) : maps.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No web maps found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {maps.map((map) => (
              <button
                key={map.id}
                onClick={() => onSelectMap(map.id, map.title)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  selectedMapId === map.id ? "bg-teal/10" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                  {map.thumbnailUrl ? (
                    <img
                      src={map.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      selectedMapId === map.id
                        ? "text-teal"
                        : "text-gray-900"
                    }`}
                  >
                    {map.title}
                  </p>
                  {map.snippet && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                      {map.snippet}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    by {map.owner} •{" "}
                    {new Date(map.modified).toLocaleDateString()}
                  </p>
                </div>

                {/* Selected indicator */}
                {selectedMapId === map.id && (
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-teal"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
