"use client";

import { useEffect, useRef, useState } from "react";
import { loadMapModules } from "@/lib/arcgis/loader";

interface MapViewerProps {
  webMapId: string | null;
  onViewReady?: (view: __esri.MapView) => void;
}

export function MapViewer({ webMapId, onViewReady }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    async function initMap() {
      if (!containerRef.current) return;

      setLoading(true);
      setError(null);

      try {
        // Load ArcGIS modules from CDN
        const { WebMap, Map, MapView, LayerList, Expand } = await loadMapModules();

        if (destroyed) return;

        // Destroy existing view
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }

        let map: __esri.WebMap | __esri.Map;

        if (webMapId) {
          // Load the specified web map
          map = new WebMap({
            portalItem: { id: webMapId },
          });
        } else {
          // Default map when nothing selected
          map = new Map({
            basemap: "topo-vector",
          });
        }

        const view = new MapView({
          container: containerRef.current,
          map,
          center: webMapId ? undefined : [-98.5795, 39.8283], // Center of US
          zoom: webMapId ? undefined : 4,
        });

        await view.when();

        if (destroyed) {
          view.destroy();
          return;
        }

        // Add LayerList widget (only for web maps with layers)
        if (webMapId) {
          const layerList = new LayerList({
            view,
          });

          const layerListExpand = new Expand({
            view,
            content: layerList,
            expanded: false,
            expandTooltip: "Layers",
            collapseTooltip: "Hide Layers",
          });

          view.ui.add(layerListExpand, "top-right");
        }

        viewRef.current = view;
        onViewReady?.(view);
      } catch (err) {
        console.error("Error loading map:", err);
        setError("Failed to load map");
      } finally {
        if (!destroyed) {
          setLoading(false);
        }
      }
    }

    initMap();

    return () => {
      destroyed = true;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [webMapId, onViewReady]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Placeholder when no map selected */}
      {!webMapId && !loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-white/90 px-6 py-4 text-center shadow-lg">
            <p className="text-gray-600">Select a web map to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
