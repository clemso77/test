from __future__ import annotations

import json
import csv
from pathlib import Path
from collections import defaultdict
from typing import Iterable


def _stop_sort_key(x: str):
    return (0, int(x)) if x.isdigit() else (1, x)


def load_allowed_route_ids(path: str | Path) -> set[str]:
    p = Path(path)
    data = json.loads(p.read_text(encoding="utf-8"))
    if not isinstance(data.get("lignes"), list):
        raise ValueError(f"{p} invalide: clé 'lignes' manquante ou non liste")
    ids = {str(x).strip() for x in data["lignes"] if str(x).strip().isdigit()}
    if not ids:
        raise ValueError(f"{p}: liste 'lignes' vide ou non numérique")
    return ids


def build_lines_cache_json(
        gtfs_dir: str | Path,
        output_json_path: str | Path,
        allowed_route_ids: set[str],
) -> None:
    """
    Sortie:
      Ligne = { nom, couleur, long_nom, id, arrets: Arret[], geometrie?: [number, number][] }
      geometrie = liste de points [lon, lat] issue de shapes.txt (si disponible)
    """
    gtfs_dir = Path(gtfs_dir)
    output_json_path = Path(output_json_path)

    routes_path = gtfs_dir / "routes.txt"
    trips_path = gtfs_dir / "trips.txt"
    stop_times_path = gtfs_dir / "stop_times.txt"
    stops_path = gtfs_dir / "stops.txt"
    shapes_path = gtfs_dir / "shapes.txt"  # ✅ NOUVEAU

    for p in (routes_path, trips_path, stop_times_path, stops_path):
        if not p.exists():
            raise FileNotFoundError(f"Missing {p}")

    # shapes.txt est parfois absent selon les feeds => on gère proprement
    has_shapes = shapes_path.exists()

    # -------------------------
    # A) Lire routes + infos ligne (filtrage strict)
    route_info: dict[str, dict] = {}
    with routes_path.open("r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            route_id = (row.get("route_id") or "").strip()
            if not route_id or route_id not in allowed_route_ids:
                continue
            if not route_id.isdigit():
                raise ValueError(f"route_id non numérique rencontré: {route_id}")

            nom = (row.get("route_short_name") or "").strip()
            long_nom = (row.get("route_long_name") or "").strip()
            color = (row.get("route_color") or "").strip().lstrip("#").upper()
            if not (len(color) == 6 and all(c in "0123456789ABCDEF" for c in color)):
                color = ""

            route_info[route_id] = {
                "id": int(route_id),
                "nom": nom or route_id,
                "long_nom": long_nom or nom or route_id,
                "couleur": color,
            }

    missing_routes = allowed_route_ids - set(route_info.keys())
    if missing_routes:
        raise RuntimeError(
            "Lignes demandées mais absentes de routes.txt:\n"
            + ", ".join(sorted(missing_routes, key=lambda x: int(x)))
        )

    route_ids = set(route_info.keys())

    # -------------------------
    # B) Canonicaliser les stops par GPS identique (inchangé)
    coord_to_ids: dict[tuple[float, float], list[str]] = defaultdict(list)
    stop_raw: dict[str, dict] = {}

    with stops_path.open("r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            stop_id = (row.get("stop_id") or "").strip()
            if not stop_id:
                continue
            if not stop_id.isdigit():
                raise ValueError(f"stop_id non numérique rencontré: {stop_id}")

            try:
                lat = float((row.get("stop_lat") or "").strip())
                lon = float((row.get("stop_lon") or "").strip())
            except Exception:
                continue

            name = (row.get("stop_name") or "").strip()
            coord = (lat, lon)
            coord_to_ids[coord].append(stop_id)
            stop_raw[stop_id] = {"stop_id": stop_id, "stop_name": name, "lat": lat, "lon": lon}

    coord_to_canon: dict[tuple[float, float], str] = {
        coord: sorted(ids, key=_stop_sort_key)[0] for coord, ids in coord_to_ids.items()
    }

    stop_to_canon: dict[str, str] = {}
    canon_stop_info: dict[str, dict] = {}

    for sid, info in stop_raw.items():
        coord = (info["lat"], info["lon"])
        canon = coord_to_canon.get(coord, sid)
        stop_to_canon[sid] = canon
        if canon not in canon_stop_info:
            canon_stop_info[canon] = {
                "id": int(canon),
                "nom": info["stop_name"] or "",
                "lat": info["lat"],
                "lon": info["lon"],
            }

    # -------------------------
    # C) trips: route -> trips + trip -> shape_id (✅)
    route_to_trips: dict[str, set[str]] = defaultdict(set)
    trip_to_route: dict[str, str] = {}
    trip_to_shape: dict[str, str] = {}  # ✅ NOUVEAU

    with trips_path.open("r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            rid = (row.get("route_id") or "").strip()
            if rid not in route_ids:
                continue

            tid = (row.get("trip_id") or "").strip()
            if not tid:
                continue

            route_to_trips[rid].add(tid)
            trip_to_route[tid] = rid

            # GTFS shapes: shape_id peut être vide
            shape_id = (row.get("shape_id") or "").strip()
            if shape_id:
                trip_to_shape[tid] = shape_id

    # -------------------------
    # D) stop_times: séquences par trip (inchangé)
    trip_to_seq: dict[str, list[tuple[int, str]]] = defaultdict(list)

    with stop_times_path.open("r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            tid = (row.get("trip_id") or "").strip()
            if tid not in trip_to_route:
                continue

            stop_id = (row.get("stop_id") or "").strip()
            if not stop_id:
                continue

            try:
                seq = int((row.get("stop_sequence") or "").strip())
            except Exception:
                continue

            canon_stop = stop_to_canon.get(stop_id, stop_id)
            trip_to_seq[tid].append((seq, canon_stop))

    # -------------------------
    # E0) Lire shapes.txt si présent (✅)
    # shape_id -> list[(seq, lon, lat)] puis on sort par seq
    shape_points: dict[str, list[tuple[int, float, float]]] = defaultdict(list)

    if has_shapes:
        with shapes_path.open("r", encoding="utf-8-sig", newline="") as f:
            r = csv.DictReader(f)
            for row in r:
                sid = (row.get("shape_id") or "").strip()
                if not sid:
                    continue
                try:
                    lat = float((row.get("shape_pt_lat") or "").strip())
                    lon = float((row.get("shape_pt_lon") or "").strip())
                    seq = int((row.get("shape_pt_sequence") or "").strip())
                except Exception:
                    continue
                # ✅ on stocke (seq, lon, lat) pour sortir en GeoJSON
                shape_points[sid].append((seq, lon, lat))

        # trier les points
        for sid, pts in shape_points.items():
            pts.sort(key=lambda x: x[0])

    # -------------------------
    # E) Pour chaque route: choisir le TRIP le plus long + construire arrets + geometrie
    lignes_out = []

    for rid in sorted(route_ids, key=lambda x: int(x)):
        trips = route_to_trips.get(rid, set())
        best_trip_id = None
        best_ordered: list[str] = []
        best_len = -1

        for tid in trips:
            pairs = trip_to_seq.get(tid, [])
            if not pairs:
                continue
            pairs_sorted = sorted(pairs, key=lambda x: x[0])

            ordered: list[str] = []
            last = None
            for _, stop_canon in pairs_sorted:
                if stop_canon != last:
                    ordered.append(stop_canon)
                    last = stop_canon

            if len(ordered) > best_len:
                best_len = len(ordered)
                best_trip_id = tid
                best_ordered = ordered

        # arrets (comme avant)
        arrets = []
        for i, sid in enumerate(best_ordered, start=1):
            info = canon_stop_info.get(sid)
            if not info:
                arrets.append(
                    {"nom": "", "id": int(sid), "position": {"lat": None, "long": None}, "sequence": i}
                )
                continue
            arrets.append(
                {
                    "nom": info["nom"],
                    "id": info["id"],
                    "position": {"lat": info["lat"], "long": info["lon"]},
                    "sequence": i,
                }
            )

        # ✅ geometrie depuis shapes (si possible)
        geometrie = None
        if has_shapes and best_trip_id is not None:
            shape_id = trip_to_shape.get(best_trip_id, "")
            pts = shape_points.get(shape_id, [])
            if pts and len(pts) >= 2:
                geometrie = [[lon, lat] for (_seq, lon, lat) in pts]

        li = {
            "id": route_info[rid]["id"],
            "nom": route_info[rid]["nom"],
            "couleur": route_info[rid]["couleur"],
            "long_nom": route_info[rid]["long_nom"],
            "arrets": arrets,
        }
        if geometrie is not None:
            li["geometrie"] = geometrie

        lignes_out.append(li)

    # -------------------------
    # F) Écrire le JSON
    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    output_json_path.write_text(
        json.dumps({"lignes": lignes_out}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"✅ JSON cache écrit: {output_json_path} (lignes={len(lignes_out)})")
    if not has_shapes:
        print("ℹ️ shapes.txt absent: aucune geometrie n'a été ajoutée.")


if __name__ == "__main__":
    allowed = load_allowed_route_ids("../res/extract/lignes_bus.json")

    build_lines_cache_json(
        "../res/OpenData_TTC_Schedules",
        "../res/extract/lignes.json",
        allowed_route_ids=allowed,
    )
