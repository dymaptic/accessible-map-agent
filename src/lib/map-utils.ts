/**
 * Utilities for collecting map metadata and capturing screenshots
 */

export interface LayerSymbology {
  type: string;
  color?: string;
  outline?: {
    color?: string;
    width?: number;
  };
  size?: number;
  style?: string;
}

export interface LayerInfo {
  id: string;
  title: string;
  visible: boolean;
  type: string;
  description?: string;
  symbology?: LayerSymbology | LayerSymbology[];
}

export interface ScaleInfo {
  scale: number;
  zoom: number;
  category: string;
  center: {
    latitude: number;
    longitude: number;
  };
  extent: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export interface MapMetadata {
  mapTitle: string;
  mapId: string | null;
  mapDescription?: string;
  layers: LayerInfo[];
  scaleInfo: ScaleInfo;
}

/**
 * Determine scale category based on zoom level
 */
function getScaleCategory(scale: number): string {
  if (scale > 50000000) return "world-level";
  if (scale > 10000000) return "continent-level";
  if (scale > 2000000) return "country-level";
  if (scale > 500000) return "state-level";
  if (scale > 100000) return "regional-level";
  if (scale > 25000) return "city-level";
  if (scale > 5000) return "neighborhood-level";
  return "street-level";
}

/**
 * Extract color from ArcGIS symbol
 */
function extractColor(color: __esri.Color | number[] | null | undefined): string | undefined {
  if (!color) return undefined;

  if (Array.isArray(color)) {
    const [r, g, b] = color;
    return `rgb(${r}, ${g}, ${b})`;
  }

  if ('r' in color && 'g' in color && 'b' in color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  return undefined;
}

/**
 * Extract symbology from a layer's renderer
 */
function extractSymbology(layer: __esri.Layer): LayerSymbology | LayerSymbology[] | undefined {
  // Check if layer has a renderer (FeatureLayer, etc.)
  const featureLayer = layer as __esri.FeatureLayer;
  if (!featureLayer.renderer) return undefined;

  const renderer = featureLayer.renderer;

  // Simple renderer
  if (renderer.type === "simple") {
    const simpleRenderer = renderer as __esri.SimpleRenderer;
    const symbol = simpleRenderer.symbol;
    if (!symbol) return undefined;
    return extractSymbolInfo(symbol);
  }

  // Unique value renderer
  if (renderer.type === "unique-value") {
    const uvRenderer = renderer as __esri.UniqueValueRenderer;
    const symbols: LayerSymbology[] = [];

    // Default symbol
    if (uvRenderer.defaultSymbol) {
      const defaultInfo = extractSymbolInfo(uvRenderer.defaultSymbol);
      if (defaultInfo) {
        symbols.push({ ...defaultInfo, style: "default" });
      }
    }

    // Unique value infos
    if (uvRenderer.uniqueValueInfos) {
      for (const info of uvRenderer.uniqueValueInfos) {
        const symbolInfo = extractSymbolInfo(info.symbol);
        if (symbolInfo) {
          symbols.push({
            ...symbolInfo,
            style: `value: ${info.value}`,
          });
        }
      }
    }

    return symbols.length > 0 ? symbols : undefined;
  }

  // Class breaks renderer
  if (renderer.type === "class-breaks") {
    const cbRenderer = renderer as __esri.ClassBreaksRenderer;
    const symbols: LayerSymbology[] = [];

    if (cbRenderer.classBreakInfos) {
      for (const info of cbRenderer.classBreakInfos) {
        const symbolInfo = extractSymbolInfo(info.symbol);
        if (symbolInfo) {
          symbols.push({
            ...symbolInfo,
            style: `${info.minValue} - ${info.maxValue}`,
          });
        }
      }
    }

    return symbols.length > 0 ? symbols : undefined;
  }

  return undefined;
}

/**
 * Extract info from a single symbol
 */
function extractSymbolInfo(symbol: __esri.Symbol | null | undefined): LayerSymbology | undefined {
  if (!symbol) return undefined;

  const info: LayerSymbology = { type: symbol.type };

  // Simple marker symbol
  if (symbol.type === "simple-marker") {
    const sms = symbol as __esri.SimpleMarkerSymbol;
    info.color = extractColor(sms.color);
    info.size = sms.size;
    info.style = sms.style;
    if (sms.outline) {
      info.outline = {
        color: extractColor(sms.outline.color),
        width: sms.outline.width,
      };
    }
  }

  // Simple line symbol
  if (symbol.type === "simple-line") {
    const sls = symbol as __esri.SimpleLineSymbol;
    info.color = extractColor(sls.color);
    info.style = sls.style;
  }

  // Simple fill symbol
  if (symbol.type === "simple-fill") {
    const sfs = symbol as __esri.SimpleFillSymbol;
    info.color = extractColor(sfs.color);
    info.style = sfs.style;
    if (sfs.outline) {
      info.outline = {
        color: extractColor(sfs.outline.color),
        width: sfs.outline.width,
      };
    }
  }

  // Picture marker symbol
  if (symbol.type === "picture-marker") {
    const pms = symbol as __esri.PictureMarkerSymbol;
    info.size = pms.width;
    info.style = "picture";
  }

  return info;
}

/**
 * Check if a layer is visible at the current scale
 * A layer is visible if:
 * 1. layer.visible is true
 * 2. Current scale is within the layer's minScale/maxScale range
 *    (0 means no limit for that boundary)
 */
function isLayerVisibleAtScale(layer: __esri.Layer, currentScale: number): boolean {
  // First check the basic visibility toggle
  if (!layer.visible) {
    return false;
  }

  // Check scale-based visibility (cast to access scale properties)
  // These properties exist on most layer types (FeatureLayer, MapImageLayer, etc.)
  const scaledLayer = layer as __esri.FeatureLayer;

  // minScale = most zoomed out (largest scale number), 0 means no limit
  // maxScale = most zoomed in (smallest scale number), 0 means no limit
  const minScale = scaledLayer.minScale || 0;
  const maxScale = scaledLayer.maxScale || 0;

  // If minScale is set and current scale is larger (more zoomed out), layer is not visible
  if (minScale > 0 && currentScale > minScale) {
    return false;
  }

  // If maxScale is set and current scale is smaller (more zoomed in), layer is not visible
  if (maxScale > 0 && currentScale < maxScale) {
    return false;
  }

  return true;
}

/**
 * Collect metadata from a MapView
 */
export async function collectMapMetadata(view: __esri.MapView): Promise<MapMetadata> {
  const map = view.map as __esri.WebMap;
  const currentScale = view.scale;

  // Get map title and description
  const mapTitle = map.portalItem?.title || "Untitled Map";
  const mapId = map.portalItem?.id || null;
  const mapDescription = map.portalItem?.snippet || undefined;

  // Collect layer info - only include layers that are actually visible at current scale
  const layers: LayerInfo[] = [];

  const allLayers = map.allLayers;
  for (const layer of allLayers) {
    // Skip basemap layers and group layers
    if (layer.type === "tile" || layer.type === "vector-tile" || layer.type === "group") {
      continue;
    }

    // Only include layers that are visible at the current scale
    if (!isLayerVisibleAtScale(layer, currentScale)) {
      continue;
    }

    const layerInfo: LayerInfo = {
      id: layer.id,
      title: layer.title || "Untitled Layer",
      visible: layer.visible,
      type: layer.type,
    };

    // Get description from portal item if available
    const featureLayer = layer as __esri.FeatureLayer;
    if (featureLayer.portalItem?.snippet) {
      layerInfo.description = featureLayer.portalItem.snippet;
    }

    // Extract symbology
    const symbology = extractSymbology(layer);
    if (symbology) {
      layerInfo.symbology = symbology;
    }

    layers.push(layerInfo);
  }

  // Get scale info
  const scaleInfo: ScaleInfo = {
    scale: Math.round(view.scale),
    zoom: Math.round(view.zoom),
    category: getScaleCategory(view.scale),
    center: {
      latitude: view.center.latitude ?? 0,
      longitude: view.center.longitude ?? 0,
    },
    extent: {
      xmin: view.extent.xmin,
      ymin: view.extent.ymin,
      xmax: view.extent.xmax,
      ymax: view.extent.ymax,
    },
  };

  return {
    mapTitle,
    mapId,
    mapDescription,
    layers,
    scaleInfo,
  };
}

/**
 * Capture a screenshot from a MapView as JPEG
 */
export async function captureScreenshot(view: __esri.MapView): Promise<Blob> {
  const screenshot = await view.takeScreenshot({
    format: "jpg",
    quality: 85,
    width: 1200,
    height: 800,
  });

  // Convert data URL to Blob
  const response = await fetch(screenshot.dataUrl);
  return response.blob();
}
