// src/services/PredictionService.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

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
    /**
     * Get delay prediction for a specific bus line
     * @param lineId - The bus line ID
     * @param data - Weather and temporal data for prediction
     * @returns Prediction response with delay estimate
     */
    static async getLinePrediction(lineId: string, data: PredictionData): Promise<PredictionResponse> {
        try {
            const response = await fetch(`${API_BASE}/lines/${lineId}/prediction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Prediction request failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error getting line prediction:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Generate sample prediction data based on current conditions
     * This is a helper to create test data
     */
    static generateSampleData(weatherCondition: string = "Clear"): PredictionData {
        const now = new Date();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        return {
            LOCAL_TIME: now.toTimeString().split(' ')[0],
            WEEK_DAY: days[now.getDay()],
            INCIDENT: "External",
            LOCAL_MONTH: now.getMonth() + 1,
            LOCAL_DAY: now.getDate(),
            TEMP: 5.0,
            DEW_POINT_TEMP: 2.0,
            HUMIDEX: 3.5,
            PRECIP_AMOUNT: 0.0,
            RELATIVE_HUMIDITY: 75.0,
            STATION_PRESSURE: 101.3,
            VISIBILITY: 15.0,
            WEATHER_ENG_DESC: weatherCondition,
            WIND_DIRECTION: 180.0,
            WIND_SPEED: 10.0,
        };
    }
}
