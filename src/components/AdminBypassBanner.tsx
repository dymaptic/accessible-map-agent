"use client";

import { useState } from "react";

interface AdminBypassBannerProps {
  groupNames: string[];
}

export function AdminBypassBanner({ groupNames }: AdminBypassBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  // Format the message based on number of groups
  const groupsMessage =
    groupNames.length <= 3
      ? groupNames.map(name => `"${name}"`).join(", ")
      : `${groupNames.length} authorized groups`;

  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-800">
            <span className="font-medium">Administrator access.</span>{" "}
            Standard users must be members of {groupsMessage} to use this app.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 flex-shrink-0 rounded-lg p-1 text-blue-600 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Dismiss banner"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
