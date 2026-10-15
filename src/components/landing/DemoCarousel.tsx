"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadMapModules } from "@/lib/arcgis/loader";
import { DEMO_EXAMPLES } from "@/lib/demos/demo-examples";

function DemoMapViewer({ webMapId }: { webMapId: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    let mounted = true;

    const initMap = async () => {
      try {
        const { WebMap, MapView } = await loadMapModules();

        if (!mounted || !mapRef.current) return;

        const webmap = new WebMap({
          portalItem: { id: webMapId },
        });

        const view = new MapView({
          container: mapRef.current,
          map: webmap,
          ui: { components: ["attribution"] },
          navigation: {
            mouseWheelZoomEnabled: false,
          },
        });

        viewRef.current = view;
        await view.when();
        if (mounted) setLoading(false);
      } catch (error) {
        console.error("Failed to load demo map:", error);
        if (mounted) setLoading(false);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [webMapId]);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-bg-light">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent" />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}

export function DemoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDemo = DEMO_EXAMPLES[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % DEMO_EXAMPLES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + DEMO_EXAMPLES.length) % DEMO_EXAMPLES.length
    );
  }, []);

  return (
    <section id="demo" className="bg-dark-bg-light py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See It In Action
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Explore real examples of AI-generated map descriptions. Each
            description is tailored to the map&apos;s content and designed for
            screen readers.
          </p>
        </div>

        {/* Demo content */}
        <div className="mt-12">
          {/* Demo selector tabs */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {DEMO_EXAMPLES.map((demo, index) => (
              <button
                key={demo.id}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  index === currentIndex
                    ? "bg-coral text-white shadow-md"
                    : "bg-dark-bg text-gray-300 hover:bg-dark-bg/80"
                }`}
              >
                {demo.title}
              </button>
            ))}
          </div>

          {/* Main content grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Map viewer */}
            <div className="relative overflow-hidden rounded-xl bg-dark-bg shadow-lg">
              <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                <span className="rounded-full bg-teal/20 px-3 py-1 text-sm font-medium text-teal-light">
                  {currentDemo.category}
                </span>
              </div>
              <div className="h-[400px] lg:h-full lg:min-h-[500px]">
                <DemoMapViewer
                  key={currentDemo.webMapId}
                  webMapId={currentDemo.webMapId}
                />
              </div>
            </div>

            {/* Description panel */}
            <div className="flex flex-col overflow-hidden rounded-xl bg-dark-bg shadow-lg">
              <div className="border-b border-dark-bg-light bg-dark-bg-light px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Generated Description
                  </h3>
                  <span className="text-sm text-gray-400">
                    AI-generated alt text
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentDemo.description}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={goToPrev}
              className="rounded-full bg-dark-bg p-2 text-gray-400 shadow-md transition-all hover:bg-dark-bg/80 hover:text-white"
              aria-label="Previous demo"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots indicator */}
            <div className="flex items-center gap-2">
              {DEMO_EXAMPLES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-coral w-6"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                  aria-label={`View demo ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="rounded-full bg-dark-bg p-2 text-gray-400 shadow-md transition-all hover:bg-dark-bg/80 hover:text-white"
              aria-label="Next demo"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
