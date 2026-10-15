"use client";

import { useState, useEffect, useCallback } from "react";
import { markdownToHtml, markdownToPlainText } from "@/lib/format-utils";

interface Generation {
  id: string;
  mapTitle: string;
  mapId: string | null;
  description: string;
  creditSource: string;
  createdAt: string;
  expiresAt: string | null;
  daysRemaining: number | null; // null = never expires
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function HistoryContent() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<{ id: string; format: "md" | "html" | "text" } | null>(null);

  const fetchGenerations = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/generations?page=${page}&limit=20`);
      if (!response.ok) throw new Error("Failed to load generations");

      const data = await response.json();
      setGenerations(data.generations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this generation? It will be permanently removed after 30 days.")) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/generations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      // Remove from list
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert("Failed to delete generation");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (generation: Generation, format: "md" | "html" | "text") => {
    try {
      let content: string;
      if (format === "html") {
        content = markdownToHtml(generation.description);
      } else if (format === "text") {
        content = markdownToPlainText(generation.description);
      } else {
        content = generation.description;
      }

      await navigator.clipboard.writeText(content);
      setCopiedId({ id: generation.id, format });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  if (loading && generations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchGenerations()}
          className="mt-4 text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Previous Generations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Retention period depends on your subscription tier.
      </p>

      {generations.length === 0 ? (
        <div className="mt-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-4 text-gray-500">No generations yet</p>
          <a
            href="/app"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Generate your first description
          </a>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              isExpanded={expandedId === generation.id}
              isDeleting={deletingId === generation.id}
              copiedFormat={
                copiedId?.id === generation.id ? copiedId.format : null
              }
              onToggleExpand={() =>
                setExpandedId(expandedId === generation.id ? null : generation.id)
              }
              onDelete={() => handleDelete(generation.id)}
              onCopy={(format) => handleCopy(generation, format)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchGenerations(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchGenerations(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface GenerationCardProps {
  generation: Generation;
  isExpanded: boolean;
  isDeleting: boolean;
  copiedFormat: "md" | "html" | "text" | null;
  onToggleExpand: () => void;
  onDelete: () => void;
  onCopy: (format: "md" | "html" | "text") => void;
}

function GenerationCard({
  generation,
  isExpanded,
  isDeleting,
  copiedFormat,
  onToggleExpand,
  onDelete,
  onCopy,
}: GenerationCardProps) {
  const createdDate = new Date(generation.createdAt);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{generation.mapTitle}</h3>
            <p className="text-sm text-gray-500">
              Generated {createdDate.toLocaleDateString()} •{" "}
              {generation.daysRemaining === null ? (
                <span className="text-green-600">Never expires</span>
              ) : generation.daysRemaining > 0 ? (
                <span>Expires in {generation.daysRemaining} days</span>
              ) : (
                <span className="text-red-600">Expired</span>
              )}
            </p>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={onToggleExpand}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg
            className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2">
        <button
          onClick={onToggleExpand}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {isExpanded ? "Collapse" : "View"}
        </button>
        <button
          onClick={() => onCopy("md")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {copiedFormat === "md" ? "Copied!" : "Copy MD"}
        </button>
        <button
          onClick={() => onCopy("html")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {copiedFormat === "html" ? "Copied!" : "Copy HTML"}
        </button>
        <button
          onClick={() => onCopy("text")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {copiedFormat === "text" ? "Copied!" : "Copy Text"}
        </button>
        <div className="flex-1" />
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          <div className="max-h-96 overflow-y-auto rounded-lg bg-white p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-900">
              {generation.description}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

