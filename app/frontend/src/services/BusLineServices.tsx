// src/services/BusLineService.ts
import type {Arret, Ligne} from "../../../backend/src/Model/Model.ts";


const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class BusLineService {

    static async getAllLines(): Promise<Ligne[]> {
        const response = await fetch(`${API_BASE}/lines`);
        if (!response.ok) throw new Error("Erreur lors du chargement des lignes");
        return response.json();
    }

    static async getLineDetails(id: string): Promise<Ligne> {
        const response = await fetch(`${API_BASE}/lines/${id}`);
        if (!response.ok) throw new Error(`Impossible de charger la ligne ${id}`);
        return response.json();
    }

    static async getStopsBulk(ids: number[]): Promise<Arret[]> {
        const res = await fetch(`${API_BASE}/stops/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error("Erreur getStopsBulk");
        return res.json();
    }

}
