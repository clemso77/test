import * as React from "react";
import mapboxgl from "mapbox-gl";

export function useBusMapLayers(mapRef: React.MutableRefObject<mapboxgl.Map | null>, isReady: boolean) {
    const initDoneRef = React.useRef(false);

    React.useEffect(() => {
        const map = mapRef.current;
        if (!isReady || !map || initDoneRef.current) return;

        if (!map.getSource("bus-lines")) {
            map.addSource("bus-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        }
        if (!map.getLayer("bus-lines-layer")) {
            map.addLayer({
                id: "bus-lines-layer",
                type: "line",
                source: "bus-lines",
                paint: {
                    "line-width": 6,
                    "line-opacity": 0.9,
                    "line-color": ["coalesce", ["get", "color"], "#2d2d2d"],
                },
                minzoom: 0,
            });
        }

        if (!map.getSource("bus-stops")) {
            map.addSource("bus-stops", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        }
        if (!map.getLayer("bus-stops-layer")) {
            map.addLayer({
                id: "bus-stops-layer",
                type: "circle",
                source: "bus-stops",
                paint: {
                    "circle-radius": 7,
                    "circle-opacity": 0.95,
                    "circle-stroke-width": 1,
                    "circle-stroke-opacity": 0.8,
                    "circle-color": "#111",
                    "circle-stroke-color": "#fff",
                },
                minzoom: 12,
            });
        }

        map.on("mouseenter", "bus-stops-layer", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "bus-stops-layer", () => (map.getCanvas().style.cursor = ""));

        initDoneRef.current = true;
    }, [isReady, mapRef]);

    const setGeoData = React.useCallback((linesFC: any, stopsFC: any) => {
        const map = mapRef.current;
        if (!map) return;

        (map.getSource("bus-lines") as mapboxgl.GeoJSONSource | undefined)?.setData(linesFC);
        (map.getSource("bus-stops") as mapboxgl.GeoJSONSource | undefined)?.setData(stopsFC);
    }, [mapRef]);

    return { setGeoData };
}
