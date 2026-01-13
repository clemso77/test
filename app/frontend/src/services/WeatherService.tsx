// src/services/WeatherService.tsx

import type {WeatherData} from "../../../backend/src/Model/Model.ts";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class WeatherService {
    /**
     * Metéo actuel
     */
    static async getCurrentWeather(): Promise<WeatherData | null> {
        try {
            const response = await fetch(`${API_BASE}/weather/current`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch weather: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching current weather:", error);
            return null;
        }
    }
}
