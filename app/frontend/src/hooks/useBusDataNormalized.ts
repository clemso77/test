import * as React from "react";
import { BusLineService } from "../services/BusLineServices.tsx";
import type {Arret, Ligne} from "../../../backend/src/Model/Model.ts";

export function useBusDataNormalized(defaultSelectionCount = Number.MAX_SAFE_INTEGER) {
  const [lineIds, setLineIds] = React.useState<number[]>([]);
  const [selectedLineIds, setSelectedLineIds] = React.useState<Set<number>>(new Set());

  const [linesById, setLinesById] = React.useState<Record<number, Ligne>>({});
  const [stopsById, setStopsById] = React.useState<Record<number, Arret>>({});

  const inFlightLinesRef = React.useRef<Set<number>>(new Set());
  const inFlightStopsRef = React.useRef(false);

  React.useEffect(() => {
    BusLineService.getAllLines().then((lines) => {
      const ids = (lines ?? []).map((l) => Number(l.id)).filter(Number.isFinite);
      setLineIds(ids);
      setSelectedLineIds(new Set(ids.slice(0, defaultSelectionCount)));
    });
  }, [defaultSelectionCount]);

  React.useEffect(() => {
    const missing = Array.from(selectedLineIds).filter(
      (id) => !linesById[id] && !inFlightLinesRef.current.has(id)
    );
    if (missing.length === 0) return;

    missing.forEach(async (id) => {
      inFlightLinesRef.current.add(id);
      try {
        const details = await BusLineService.getLineDetails(id.toString());
        setLinesById((prev) => ({ ...prev, [id]: details }));
      } catch (e) {
        console.error("getLineDetails failed:", id, e);
      } finally {
        inFlightLinesRef.current.delete(id);
      }
    });
  }, [selectedLineIds, linesById]);

  React.useEffect(() => {
    const selectedDetails = Array.from(selectedLineIds)
      .map((id) => linesById[id])
      .filter(Boolean);

    if (selectedDetails.length === 0) return;
    if (inFlightStopsRef.current) return;

    const neededStopIds = new Set<number>();
    for (const line of selectedDetails) {
      for (let sid of line.stopIds ?? []) neededStopIds.add(sid);
    }

    const missingStopIds = Array.from(neededStopIds).filter((sid) => !stopsById[sid] && Number.isFinite(sid));
    if (missingStopIds.length === 0) return;

    inFlightStopsRef.current = true;
    BusLineService.getStopsBulk(missingStopIds)
      .then((stops) => {
        setStopsById((prev) => {
          const next = { ...prev };
          for (const s of stops ?? []) next[Number(s.id)] = s;
          return next;
        });
      })
      .catch((e) => console.error("getStopsBulk failed:", e))
      .finally(() => {
        inFlightStopsRef.current = false;
      });
  }, [selectedLineIds, linesById, stopsById]);

  const toggleLine = React.useCallback((id: number) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    lineIds,
    selectedLineIds,
    linesById,
    stopsById,
    toggleLine,
    setSelectedLineIds,
  };
}
