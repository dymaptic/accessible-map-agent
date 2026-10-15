"use client";

import { useState, useCallback, useEffect } from "react";
import { MapViewer } from "@/components/map/MapViewer";
import { MapPicker } from "@/components/map/MapPicker";
import { DescriptionPanel } from "@/components/generation/DescriptionPanel";
import { collectMapMetadata, captureScreenshot } from "@/lib/map-utils";

interface AppContentProps {
  username: string;
  orgId: string;
}

type GenerationState = "idle" | "capturing" | "generating" | "done" | "error";
type ViewMode = "select" | "result";

export function AppContent({ username, orgId }: AppContentProps) {
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedMapTitle, setSelectedMapTitle] = useState<string | null>(null);
  const [mapView, setMapView] = useState<__esri.MapView | null>(null);

  // Organization sharing opt-in
  const [sharingOptIn, setSharingOptIn] = useState(false);

  // Generation state
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [description, setDescription] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // View mode: "select" shows map picker, "result" shows description
  const [viewMode, setViewMode] = useState<ViewMode>("select");

  // Fetch org sharing status on mount
  useEffect(() => {
    async function fetchSharingStatus() {
      try {
        const response = await fetch("/api/org/settings");
        if (response.ok) {
          const data = await response.json();
          setSharingOptIn(data.sharingOptIn);
        }
      } catch {
        // Silently ignore - sharing indicator is optional
      }
    }
    fetchSharingStatus();
  }, []);

  const handleSelectMap = useCallback((mapId: string, title: string) => {
    setSelectedMapId(mapId);
    setSelectedMapTitle(title);
    // Clear previous generation when selecting new map
    setDescription("");
    setWordCount(0);
    setError(null);
    setGenerationState("idle");
  }, []);

  const handleViewReady = useCallback((view: __esri.MapView) => {
    setMapView(view);
  }, []);

  const handleChangeMap = useCallback(() => {
    setViewMode("select");
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!mapView || !selectedMapId) return;

    setGenerationState("capturing");
    setDescription("");
    setWordCount(0);
    setError(null);
    // Switch to result view when generation starts
    setViewMode("result");

    try {
      // 1. Collect map metadata
      const mapData = await collectMapMetadata(mapView);

      // 2. Capture screenshot
      const screenshot = await captureScreenshot(mapView);

      setGenerationState("generating");

      // 3. Create form data
      const formData = new FormData();
      formData.append("screenshot", screenshot, "screenshot.jpg");
      formData.append("mapData", JSON.stringify(mapData));

      // 4. Start streaming request
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      // 5. Process streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            if (event.type === "delta") {
              setDescription((prev) => prev + event.content);
            } else if (event.type === "done") {
              setWordCount(event.wordCount);
              setGenerationState("done");
              // Dispatch event to refresh header stats
              window.dispatchEvent(new CustomEvent("generation-complete"));
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch {
            // Ignore parse errors for partial JSON
          }
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Generation failed");
      setGenerationState("error");
    }
  }, [mapView, selectedMapId]);

  const isGenerating = generationState === "capturing" || generationState === "generating";
  const canGenerate = selectedMapId && mapView && !isGenerating;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left side: Map viewer */}
      <div className="h-1/2 border-b border-gray-200 lg:h-full lg:flex-1 lg:border-b-0 lg:border-r">
        <MapViewer webMapId={selectedMapId} onViewReady={handleViewReady} />
      </div>

      {/* Right side: Controls panel */}
      <div className="flex h-1/2 w-full flex-col bg-white lg:h-full lg:w-96">
        {viewMode === "select" ? (
          // Map selection view - full height
          <>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Select a Web Map
              </h2>
            </div>

            {/* Map picker - takes most space */}
            <div className="flex-1 overflow-hidden">
              <MapPicker
                username={username}
                orgId={orgId}
                selectedMapId={selectedMapId}
                onSelectMap={handleSelectMap}
              />
            </div>

            {/* Generate section - fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              {/* Selected map info */}
              {selectedMapTitle && (
                <div className="mb-4 rounded-lg bg-teal/10 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-teal">
                    Selected Map
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {selectedMapTitle}
                  </p>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-coral-dark disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isGenerating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {generationState === "capturing"
                      ? "Capturing..."
                      : "Generating..."}
                  </>
                ) : (
                  "Generate Description"
                )}
              </button>

              {!selectedMapId && (
                <p className="mt-2 text-center text-xs text-gray-500">
                  Select a map to generate an accessible description
                </p>
              )}

              {/* Sharing indicator */}
              {sharingOptIn && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-teal">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Helping improve accessibility</span>
                </div>
              )}
            </div>
          </>
        ) : (
          // Result view - full height for description
          <>
            {/* Collapsed map info header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Map
                  </p>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {selectedMapTitle}
                  </p>
                </div>
                <button
                  onClick={handleChangeMap}
                  disabled={isGenerating}
                  className="flex-shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Change Map
                </button>
              </div>
            </div>

            {/* Description panel - takes all remaining space */}
            <div className="flex-1 overflow-hidden">
              <DescriptionPanel
                description={description}
                isGenerating={isGenerating}
                wordCount={wordCount}
                error={error}
                onRegenerate={handleGenerate}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
