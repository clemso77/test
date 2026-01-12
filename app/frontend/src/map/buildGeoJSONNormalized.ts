import type {Arret, Ligne} from "../../../backend/src/Model/Model.ts";

type LngLat = [number, number];

function clamp01(t: number) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
}

function projectPointToSegment(p: LngLat, a: LngLat, b: LngLat) {
    const [px, py] = p;
    const [ax, ay] = a;
    const [bx, by] = b;

    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;

    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return { point: a, t: 0, dist2: (px - ax) ** 2 + (py - ay) ** 2 };

    const t = clamp01((apx * abx + apy * aby) / ab2);
    const x = ax + t * abx;
    const y = ay + t * aby;

    const dx = px - x;
    const dy = py - y;

    return { point: [x, y] as LngLat, t, dist2: dx * dx + dy * dy };
}

export function snapPointToLine(p: LngLat, line: LngLat[]) {
    if (!line || line.length < 2) return { snapped: p, dist2: Number.POSITIVE_INFINITY };

    let best = { snapped: p, dist2: Number.POSITIVE_INFINITY };

    for (let i = 0; i < line.length - 1; i++) {
        const a = line[i];
        const b = line[i + 1];
        const proj = projectPointToSegment(p, a, b);
        if (proj.dist2 < best.dist2) best = { snapped: proj.point, dist2: proj.dist2 };
    }

    return best;
}


function stopCoord(s: Arret): LngLat | null {
    const lon = s?.position?.long;
    const lat = s?.position?.lat;
    if (typeof lon !== "number" || typeof lat !== "number") return null;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
    return [lon, lat];
}

function asColorHex(line: Ligne): string {
    const c = line?.couleur;
    if (typeof c === "string") return c.startsWith("#") ? c : `#${c}`;
    return "#ff0000";
}

export function buildGeoJSONNormalized(
    linesById: Record<number, Ligne>,
    stopsById: Record<number, Arret>,
    selected: Set<number>
) {
    const stopToLines = new Map<number, Set<number>>();
    const lineFeatures: any[] = [];

    for (const lineId of selected) {
        const line = linesById[lineId];
        if (!line) continue;
        lineFeatures.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: line.geometries ?? [] },
            properties: {
                id: lineId,
                name: line.nom ?? `Ligne ${lineId}`,
                color: asColorHex(line),
            },
        });

        // mapping stop -> lines
        for (const stopIdRaw of line.stopIds ?? []) {
            const stopId = Number(stopIdRaw);
            if (!Number.isFinite(stopId)) continue;
            if (!stopToLines.has(stopId)) stopToLines.set(stopId, new Set());
            stopToLines.get(stopId)!.add(lineId);
        }

    }

    const stopFeatures: any[] = [];
    for (const [stopId, lineSet] of stopToLines.entries()) {
        const stop = stopsById[stopId];
        if (!stop) continue;

        const c = stopCoord(stop);
        if (!c) continue;

        let bestSnapped: [number, number] = c;
        // SI jamais c'est trop abberant
        let bestDist2 = Number.POSITIVE_INFINITY;

        for (const lineId of lineSet) {
            const shape = (linesById[lineId] as any)?.geometrie ?? (linesById[lineId] as any)?.geometries ?? [];
            if (!Array.isArray(shape) || shape.length < 2) continue;

            const {snapped, dist2} = snapPointToLine(c, shape);
            if (dist2 < bestDist2) {
                bestDist2 = dist2;
                bestSnapped = snapped;
            }
        }
        stopFeatures.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: bestSnapped },
            properties: {
                id: stopId,
                name: stop.nom ?? `Arrêt ${stopId}`,
                lineIds: JSON.stringify(Array.from(lineSet).sort((a, b) => a - b)),
            },
        });
    }


    return {
        linesFC: { type: "FeatureCollection", features: lineFeatures },
        stopsFC: { type: "FeatureCollection", features: stopFeatures },
    };
}
