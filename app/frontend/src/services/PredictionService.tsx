import type {LinePrediction, PredictionInput} from "../../../backend/src/Model/Model.ts";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class PredictionService {
    static async getLinePrediction(lineId: string, data: PredictionInput): Promise<LinePrediction | null> {
        try {
            const response = await fetch(`${API_BASE}/lines/${lineId}/prediction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Prediction request failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting line prediction:', error);
            return null;
        }
    }
}
