const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export interface PredictionData {
    LOCAL_TIME: string;
    WEEK_DAY: string;
    INCIDENT: string;
    LOCAL_MONTH: number;
    LOCAL_DAY: number;
    TEMP: number;
    DEW_POINT_TEMP: number;
    HUMIDEX: number;
    PRECIP_AMOUNT: number;
    RELATIVE_HUMIDITY: number;
    STATION_PRESSURE: number;
    VISIBILITY: number;
    WEATHER_ENG_DESC: string;
    WIND_DIRECTION: number;
    WIND_SPEED: number;
}

export interface PredictionResponse {
    success: boolean;
    lineId?: string;
    predictedDelay?: number;
    unit?: string;
    error?: string;
}

export class PredictionService {
    static async getLinePrediction(lineId: string, data: PredictionData): Promise<PredictionResponse> {
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
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
