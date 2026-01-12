from __future__ import annotations

import csv
from pathlib import Path
from collections import defaultdict


def get_longest_trip_stops_for_route(
        gtfs_dir: str | Path,
        route_id: str,
        bus_only: bool = True,
) -> dict:
    """
    Retourne le trip le plus long (max #stops) pour une ligne (route_id) et ses arrêts ordonnés.

    Fichiers requis: routes.txt (si bus_only), trips.txt, stop_times.txt, stops.txt
    Canonicalisation stop: stops avec GPS identiques => même stop_id (choix: plus petit stop_id)
    """
    gtfs_dir = Path(gtfs_dir)
    routes_path = gtfs_dir / "routes.txt"
    trips_path = gtfs_dir / "trips.txt"
    stop_times_path = gtfs_dir / "stop_times.txt"
    stops_path = gtfs_dir / "stops.txt"

    for p in (trips_path, stop_times_path, stops_path):
        if not p.exists():
            raise FileNotFoundError(f"Missing {p}")

    # (optionnel) vérif bus
    if bus_only:
        if not routes_path.exists():
            raise FileNotFoundError(f"Missing {routes_path}")
        is_bus = False
        with routes_path.open("r", encoding="utf-8-sig", newline="") as f:
            r = csv.DictReader(f)
            for row in r:
                if (row.get("route_id") or "").strip() == str(route_id):
                    is_bus = (row.get("route_type") or "").strip() == "3"
                    break
        if not is_bus:
            raise ValueError(f"route_id={route_id} n'est pas un bus (route_type != 3) ou introuvable.")

    # 1) stops: coord -> canonical stop_id, + info stop
    coord_to_ids: dict[tuple[float, float], list[str]] = defaultdict(list)
    stop_info_raw: dict[str, dict] = {}

    with stops_path.open("r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            sid = (row.get("stop_id") or "").strip()
            if not sid:
                continue
            try:
                lat = float((row.get("stop_lat") or "").strip())
                lon = float((row.get("stop_lon") or "").strip())
            except Exception:
                continue
            coord = (lat, lon)
            coord_to_ids[coord].append(sid)
            stop_info_raw[sid] = {
                "stop_id": sid,
                "stop_name": (row.get("stop_name") or "").strip(),
                "lat": lat,
                "lon": lon,
            }

    def stop_sort_key(x: str):
        return (0, int(x)) if x.isdigit() else (1, x)

    coord_to_canon = {c: sorted(ids, key=stop_sort_key)[0] for c, ids in coord_to_ids.items()}
    stop_to_canon: dict[str, str] = {}
    canon_info: dict[str, dict] = {}
    for sid, info in stop_info_raw.items():
        canon = coord_to_canon[(info["lat"], info["lon"])]
        stop_to_canon[sid] = canon
        # on garde les infos du canon (peu importe laquelle, coords identiques)
        if canon not in canon_info:
            canon_info[canon] = {
                "stop_id": canon,
                "stop_name": info["stop_name"] or None,
                "lat": info["lat"],
                "lon": info["lon"],
            }

    # 2) récupérer tous les trip_id de la ligne
    route_trip_ids: set[str] = set()
    with trips_path.open("r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            if (row.get("route_id") or "").strip() == str(route_id):
                tid = (row.get("trip_id") or "").strip()
                if tid:
                    route_trip_ids.add(tid)

    if not route_trip_ids:
        raise ValueError(f"Aucun trip trouvé pour route_id={route_id}")

    # 3) stop_times groupés par trip (uniquement ceux de la ligne)
    trip_to_seq: dict[str, list[tuple[int, str]]] = defaultdict(list)
    with stop_times_path.open("r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            tid = (row.get("trip_id") or "").strip()
            if tid not in route_trip_ids:
                continue
            sid = (row.get("stop_id") or "").strip()
            if not sid:
                continue
            try:
                seq = int((row.get("stop_sequence") or "").strip())
            except Exception:
                continue
            trip_to_seq[tid].append((seq, stop_to_canon.get(sid, sid)))

    # 4) choisir le trip le plus long (max #stops uniques ordonnés)
    best_trip_id = None
    best_stops_ordered: list[str] = []
    best_len = -1

    for tid, pairs in trip_to_seq.items():
        pairs.sort(key=lambda x: x[0])
        ordered: list[str] = []
        last = None
        for _, sid in pairs:
            if sid != last:
                ordered.append(sid)
                last = sid
        # (optionnel) enlever doublons non-consécutifs: tu peux le faire si besoin, mais on garde simple
        if len(ordered) > best_len:
            best_len = len(ordered)
            best_trip_id = tid
            best_stops_ordered = ordered

    if best_trip_id is None:
        raise ValueError(f"Impossible de construire les stops pour route_id={route_id}")

    # 5) enrichir avec nom + coords
    stops = []
    for i, sid in enumerate(best_stops_ordered, start=1):
        info = canon_info.get(sid, {"stop_id": sid, "stop_name": None, "lat": None, "lon": None})
        stops.append({
            "stop_order": i,
            "stop_id": sid,
            "stop_name": info.get("stop_name"),
            "lat": info.get("lat"),
            "lon": info.get("lon"),
        })

    return {
        "route_id": str(route_id),
        "trip_id": best_trip_id,
        "n_stops": best_len,
        "stops": stops,
    }

print(get_longest_trip_stops_for_route("../res/OpenData_TTC_Schedules", "48", True));