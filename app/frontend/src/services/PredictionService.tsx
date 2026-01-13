import type {IncidentType, PredictionOutput} from "../../../backend/src/Model/Model.ts";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class PredictionService {
    static async getLinePrediction(lineId: string, incidents: IncidentType): Promise<PredictionOutput | null> {
        try {
            const response = await fetch(`${API_BASE}/lines/${lineId}/prediction/${incidents}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.status != 200) {
                throw new Error(`Prediction request failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting line prediction:', error);
            return null;
        }
    }
}
