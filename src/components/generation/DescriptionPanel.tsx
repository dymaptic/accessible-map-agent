"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { AIDisclosureBadge } from "@/components/ui/AIDisclosureBadge";
import { markdownToHtml, markdownToPlainText } from "@/lib/format-utils";

const HIDE_WHATS_NEXT_KEY = "ama-hide-whats-next";

interface DescriptionPanelProps {
  description: string;
  isGenerating: boolean;
  wordCount: number;
  error: string | null;
  onRegenerate?: () => void;
}

export function DescriptionPanel({
  description,
  isGenerating,
  wordCount,
  error,
  onRegenerate,
}: DescriptionPanelProps) {
  const [copiedFormat, setCopiedFormat] = useState<
    "md" | "html" | "text" | null
  >(null);
  const [hideWhatsNext, setHideWhatsNext] = useState(true); // Default to hidden until we check localStorage

  // Check localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIDE_WHATS_NEXT_KEY);
      setHideWhatsNext(stored === "true");
    } catch {
      // localStorage may not be available (private browsing)
      setHideWhatsNext(false);
    }
  }, []);

  const handleDismissWhatsNext = useCallback(() => {
    const confirmed = confirm(
      'Hide this link?\n\nThe "What do I do with this?" link will no longer appear in the description panel. To bring it back, clear your browser\'s data for this site.'
    );
    if (confirmed) {
      try {
        localStorage.setItem(HIDE_WHATS_NEXT_KEY, "true");
        setHideWhatsNext(true);
      } catch {
        // localStorage may not be available
      }
    }
  }, []);

  const copyAsMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopiedFormat("md");
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [description]);

  const copyAsHtml = useCallback(async () => {
    try {
      const html = markdownToHtml(description);
      await navigator.clipboard.writeText(html);
      setCopiedFormat("html");
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [description]);

  const copyAsPlainText = useCallback(async () => {
    try {
      const text = markdownToPlainText(description);
      await navigator.clipboard.writeText(text);
      setCopiedFormat("text");
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [description]);

  // Empty state
  if (!description && !isGenerating && !error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
            <svg
              className="mx-auto h-10 w-10 text-gray-300"
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
            <p className="mt-3 text-sm text-gray-500">
              Generated description will appear here
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <button
              disabled
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400"
            >
              Copy Markdown
            </button>
            <button
              disabled
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400"
            >
              Copy HTML
            </button>
            <button
              disabled
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400"
            >
              Copy Plain Text
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <svg
              className="mx-auto h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-red-800">
              Generation Failed
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with stats */}
      <div className="flex-shrink-0 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Generating...
              </span>
            ) : (
              <AIDisclosureBadge />
            )}
          </span>
          <span className="text-xs text-gray-400">
            {wordCount > 0 && `${wordCount.toLocaleString()} words`}
          </span>
        </div>
      </div>

      {/* Description content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose prose-sm max-w-none">
          <MarkdownRenderer content={description} />
          {isGenerating && (
            <span className="inline-block h-4 w-1 animate-pulse bg-blue-500" />
          )}
        </div>
      </div>

      {/* AI disclaimer */}
      {description && !isGenerating && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> This text is generated by AI. AI can make mistakes.
            Always review and edit this text before publishing.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex flex-col gap-2">
          {/* Copy buttons row */}
          <div className="flex gap-2">
            <button
              onClick={copyAsMarkdown}
              disabled={isGenerating || !description}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
            >
              {copiedFormat === "md" ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" />
                  Copy Markdown
                </>
              )}
            </button>
            <button
              onClick={copyAsHtml}
              disabled={isGenerating || !description}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
            >
              {copiedFormat === "html" ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <CodeIcon className="h-4 w-4" />
                  Copy HTML
                </>
              )}
            </button>
            <button
              onClick={copyAsPlainText}
              disabled={isGenerating || !description}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
            >
              {copiedFormat === "text" ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <TextIcon className="h-4 w-4" />
                  Copy Plain Text
                </>
              )}
            </button>
          </div>
          {/* Regenerate button */}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <RefreshIcon className="h-4 w-4" />
              Regenerate Description
            </button>
          )}
          {/* What's next help link (dismissable) */}
          {!hideWhatsNext && (
            <div className="flex items-center justify-center gap-1.5">
              <Link
                href="/help/using-your-description"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-teal-light transition-colors hover:text-coral"
              >
                <QuestionIcon className="h-3.5 w-3.5" />
                What do I do with this?
              </Link>
              <button
                onClick={handleDismissWhatsNext}
                className="flex cursor-pointer items-center self-center rounded text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Dismiss help link"
              >
                <DismissIcon className="mb-0.5 h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple markdown renderer component
 */
function MarkdownRenderer({ content }: { content: string }) {
  // Split content into sections by headers
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ");
      elements.push(
        <p key={elements.length} className="mb-3 text-gray-700">
          {renderInlineMarkdown(text)}
        </p>
      );
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      flushParagraph();
      elements.push(
        <h3
          key={elements.length}
          className="mb-2 mt-4 text-base font-semibold text-gray-900"
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushParagraph();
      elements.push(
        <h2
          key={elements.length}
          className="mb-2 mt-5 text-lg font-semibold text-gray-900"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushParagraph();
      elements.push(
        <h1
          key={elements.length}
          className="mb-3 mt-6 text-xl font-bold text-gray-900"
        >
          {line.slice(2)}
        </h1>
      );
    }
    // List items
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      elements.push(
        <li key={elements.length} className="ml-4 text-gray-700">
          {renderInlineMarkdown(line.slice(2))}
        </li>
      );
    }
    // Code blocks
    else if (line.startsWith("```")) {
      flushParagraph();
      // Skip to end of code block
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={elements.length}
          className="my-3 overflow-x-auto rounded bg-gray-100 p-3 text-xs text-gray-800"
        >
          {codeLines.join("\n")}
        </pre>
      );
    }
    // Empty lines
    else if (line.trim() === "") {
      flushParagraph();
    }
    // Regular text
    else {
      currentParagraph.push(line);
    }
  }

  flushParagraph();

  return <>{elements}</>;
}

/**
 * Render inline markdown (bold, italic)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(
        <strong key={key++} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/\*(.*?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.slice(0, italicMatch.index));
      }
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // No more matches
    parts.push(remaining);
    break;
  }

  return parts;
}

// Icons
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h7"
      />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DismissIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
