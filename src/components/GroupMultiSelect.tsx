"use client";

import { useState, useEffect, useRef } from "react";

interface Group {
  id: string;
  title: string;
  memberCount?: number;
}

interface GroupMultiSelectProps {
  selectedGroups: Group[];
  onSelectionChange: (groups: Group[]) => void;
  disabled?: boolean;
}

export function GroupMultiSelect({
  selectedGroups,
  onSelectionChange,
  disabled = false,
}: GroupMultiSelectProps) {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch available groups on mount
  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch("/api/org/available-groups");
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        const data = await response.json();
        setAvailableGroups(data.groups || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load groups");
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter groups based on search query and exclude already selected
  const selectedIds = new Set(selectedGroups.map(g => g.id));
  const filteredGroups = availableGroups.filter(
    group =>
      !selectedIds.has(group.id) &&
      group.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectGroup = (group: Group) => {
    onSelectionChange([...selectedGroups, group]);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleRemoveGroup = (groupId: string) => {
    onSelectionChange(selectedGroups.filter(g => g.id !== groupId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        Loading groups...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dropdown */}
      <div ref={dropdownRef} className="relative">
        <div
          className={`flex items-center rounded-lg border bg-white ${
            disabled ? "border-gray-200 bg-gray-50" : "border-gray-300"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search groups..."
            disabled={disabled}
            className="flex-1 rounded-lg border-0 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0 disabled:bg-gray-50 disabled:text-gray-500"
            aria-label="Search groups"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="group-listbox"
          />
          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            disabled={disabled}
            className="px-3 py-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label={isOpen ? "Close dropdown" : "Open dropdown"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Dropdown menu */}
        {isOpen && !disabled && (
          <ul
            id="group-listbox"
            role="listbox"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {filteredGroups.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                {searchQuery ? "No matching groups" : "No more groups available"}
              </li>
            ) : (
              filteredGroups.map(group => (
                <li
                  key={group.id}
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelectGroup(group)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectGroup(group);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <span className="font-medium text-gray-900">{group.title}</span>
                  {group.memberCount !== undefined && (
                    <span className="ml-2 text-gray-500">
                      ({group.memberCount} {group.memberCount === 1 ? "member" : "members"})
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Selected groups as chips */}
      {selectedGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGroups.map(group => (
            <span
              key={group.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {group.title}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Remove ${group.title}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Help text */}
      {selectedGroups.length === 0 && !disabled && (
        <p className="text-sm text-gray-500">
          Select one or more groups from the dropdown above.
        </p>
      )}
    </div>
  );
}
