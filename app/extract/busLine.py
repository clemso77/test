import json
from pathlib import Path

def normalize_lines_and_stops(
        input_lignes_json: str | Path,
        output_lines_json: str | Path,
        output_stops_json: str | Path,
) -> None:
    input_lignes_json = Path(input_lignes_json)
    output_lines_json = Path(output_lines_json)
    output_stops_json = Path(output_stops_json)

    data = json.loads(input_lignes_json.read_text(encoding="utf-8"))
    lignes_in = data.get("lignes", [])

    stops_by_id: dict[int, dict] = {}
    lignes_out = []

    for line in lignes_in:
        line_id = int(line["id"])
        arrets = line.get("arrets", []) or []
        geometries = line.get("geometrie", []) or []

        stop_ids = []
        for a in arrets:
            sid = int(a["id"])
            stop_ids.append(sid)

            # Stop unique (1 seule fois)
            if sid not in stops_by_id:
                pos = a.get("position") or {}
                stops_by_id[sid] = {
                    "id": sid,
                    "nom": a.get("nom", ""),
                    "position": {
                        "lat": float(pos.get("lat")) if pos.get("lat") is not None else None,
                        "long": float(pos.get("long")) if pos.get("long") is not None else None,
                    },
                }

        lignes_out.append({
            "id": line_id,
            "nom": line.get("nom", str(line_id)),
            "couleur": line.get("couleur", ""),
            "long_nom": line.get("long_nom", line.get("nom", str(line_id))),
            "stopIds": stop_ids,  # IMPORTANT : ordre conservé
            "geometries": geometries,
        })

    # write files
    output_lines_json.parent.mkdir(parents=True, exist_ok=True)
    output_stops_json.parent.mkdir(parents=True, exist_ok=True)

    output_lines_json.write_text(
        json.dumps({"lignes": lignes_out}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    output_stops_json.write_text(
        json.dumps({"stops": list(stops_by_id.values())}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"✅ wrote {output_lines_json} (lignes={len(lignes_out)})")
    print(f"✅ wrote {output_stops_json} (stops uniques={len(stops_by_id)})")


if __name__ == "__main__":
    # toi tu génères déjà lignes.json via build_lines_cache_json(...)
    # ensuite tu normalises :
    normalize_lines_and_stops(
        "../res/extract/lignes.json",
        "../res/extract/lines_normalized.json",
        "../res/extract/stops_normalized.json",
    )
