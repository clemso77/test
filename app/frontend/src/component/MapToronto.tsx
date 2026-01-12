import React from "react";
import mapboxgl from "mapbox-gl";
import { Weather } from "./Weather.tsx";
import BusLinesPanel from "./BusLinesPanel.tsx";
import { useBusDataNormalized } from "../hooks/useBusDataNormalized.ts";
import { useBusMapLayers } from "../hooks/useBusMapLayers.ts";
import { buildGeoJSONNormalized } from "../map/buildGeoJSONNormalized.ts";

export default function MapToronto() {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const mapRef = React.useRef<mapboxgl.Map | null>(null);
    const [isMapReady, setIsMapReady] = React.useState(false);

    const { lineIds, selectedLineIds, linesById, stopsById, toggleLine } = useBusDataNormalized();
    const { setGeoData } = useBusMapLayers(mapRef, isMapReady);

    // init map
    React.useEffect(() => {
        if (mapRef.current) return;

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current!,
            style: "mapbox://styles/clementmartins/cmh0o7rch000e01s7g2psbnz8",
            center: [-79.3832, 43.6532],
            zoom: 12,
        });

        map.on("load", () => {
            mapRef.current = map;
            setIsMapReady(true);

            // popup stop => montre les lignes associées
            map.on("click", "bus-stops-layer", (e) => {
                const f = e.features?.[0] as any;
                if (!f) return;

                const stopName = f.properties?.name ?? "Arrêt";
                const id = f.properties.id ?? "0";
                const raw = f.properties?.lineIds ?? "[]";
                let lineIds: number[] = [];
                try {
                    lineIds = JSON.parse(raw);
                } catch {
                    lineIds = String(raw)
                        .split(",")
                        .map((s) => Number(s.trim()))
                        .filter(Number.isFinite);
                }

                new mapboxgl.Popup()
                    .setLngLat((f.geometry as any).coordinates)
                    .setHTML(`<strong>${stopName}, id: ${id}</strong><br/><small>Lignes: ${lineIds.join(", ")}</small>`)
                    .addTo(map);
            });
        });

        return () => {
            map.remove();
            mapRef.current = null;
            setIsMapReady(false);
        };
    }, []);

    // build + push geojson
    React.useEffect(() => {
        if (!isMapReady) return;

        const { linesFC, stopsFC } = buildGeoJSONNormalized(linesById, stopsById, selectedLineIds);
        setGeoData(linesFC as any, stopsFC as any);
    }, [isMapReady, linesById, stopsById, selectedLineIds, setGeoData]);

    return (
        <>
            <div ref={mapContainerRef} style={{ width: "100vw", height: "100vh" }} />

            {isMapReady && (
                <>
                    <BusLinesPanel
                        lineIds={lineIds.map(String)}
                        selected={new Set(Array.from(selectedLineIds).map(String))}
                        onToggle={(idStr: string) => toggleLine(Number(idStr))}
                    />

                    <Weather map={mapRef.current!} temperature={22} condition="" />
                </>
            )}
        </>
    );
}
