/**
 * ArcGIS Maps SDK CDN Loader
 *
 * Loads the ArcGIS Maps SDK from the Esri CDN instead of bundling it,
 * which dramatically reduces build times and bundle sizes.
 */

const ARCGIS_VERSION = "4.31";
const ARCGIS_CDN_URL = `https://js.arcgis.com/${ARCGIS_VERSION}`;

// Track loading state
let loadPromise: Promise<void> | null = null;
let isLoaded = false;

/**
 * Load the ArcGIS Maps SDK from CDN
 * This function is idempotent - multiple calls will return the same promise
 */
export function loadArcGIS(): Promise<void> {
  if (isLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== "undefined" && (window as unknown as { require?: unknown }).require) {
      isLoaded = true;
      resolve();
      return;
    }

    // Load CSS
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `${ARCGIS_CDN_URL}/esri/themes/light/main.css`;
    document.head.appendChild(cssLink);

    // Load the main ArcGIS script
    const script = document.createElement("script");
    script.src = `${ARCGIS_CDN_URL}/init.js`;
    script.async = true;

    script.onload = () => {
      isLoaded = true;
      resolve();
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load ArcGIS Maps SDK from CDN"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

// Constructor types for ArcGIS classes
type WebMapConstructor = new (properties?: __esri.WebMapProperties) => __esri.WebMap;
type MapConstructor = new (properties?: __esri.MapProperties) => __esri.Map;
type MapViewConstructor = new (properties?: __esri.MapViewProperties) => __esri.MapView;
type OAuthInfoConstructor = new (properties?: __esri.OAuthInfoProperties) => __esri.OAuthInfo;
type PortalConstructor = new (properties?: __esri.PortalProperties) => __esri.Portal;
type LayerListConstructor = new (properties?: __esri.LayerListProperties) => __esri.LayerList;
type ExpandConstructor = new (properties?: __esri.ExpandProperties) => __esri.Expand;

/**
 * Load ArcGIS modules using the AMD require
 */
function loadModules<T extends unknown[]>(
  moduleNames: string[]
): Promise<T> {
  return loadArcGIS().then(() => {
    return new Promise((resolve, reject) => {
      const require = (window as unknown as { require: (modules: string[], callback: (...args: unknown[]) => void, errback: (err: Error) => void) => void }).require;
      require(
        moduleNames,
        (...modules: unknown[]) => resolve(modules as T),
        (err: Error) => reject(err)
      );
    });
  });
}

/**
 * Convenience function to load common map modules
 */
export async function loadMapModules(): Promise<{
  WebMap: WebMapConstructor;
  Map: MapConstructor;
  MapView: MapViewConstructor;
  LayerList: LayerListConstructor;
  Expand: ExpandConstructor;
}> {
  const [WebMap, Map, MapView, LayerList, Expand] = await loadModules<
    [WebMapConstructor, MapConstructor, MapViewConstructor, LayerListConstructor, ExpandConstructor]
  >([
    "esri/WebMap",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/LayerList",
    "esri/widgets/Expand",
  ]);

  return { WebMap, Map, MapView, LayerList, Expand };
}

/**
 * Convenience function to load auth modules
 */
export async function loadAuthModules(): Promise<{
  IdentityManager: __esri.IdentityManager;
  OAuthInfo: OAuthInfoConstructor;
  Portal: PortalConstructor;
}> {
  const [IdentityManager, OAuthInfo, Portal] = await loadModules<
    [__esri.IdentityManager, OAuthInfoConstructor, PortalConstructor]
  >([
    "esri/identity/IdentityManager",
    "esri/identity/OAuthInfo",
    "esri/portal/Portal",
  ]);

  return { IdentityManager, OAuthInfo, Portal };
}
