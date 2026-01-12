// src/services/WeatherService.tsx

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface CurrentWeather {
    temperature: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    visibility: number;
    description: string;
    windSpeed: number | null;
    windDirection: number | null;
    precipitation: number;
    humidex: number | null;
    timestamp: string;
}

export interface WeatherForPrediction {
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
    LOCAL_TIME: string;
    LOCAL_MONTH: number;
    LOCAL_DAY: number;
}

export class WeatherService {
    /**
     * Get current weather data for display
     */
    static async getCurrentWeather(): Promise<CurrentWeather | null> {
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

    /**
     * Get weather data formatted for prediction API
     */
    static async getWeatherForPrediction(): Promise<WeatherForPrediction | null> {
        try {
            const response = await fetch(`${API_BASE}/weather/prediction-data`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch weather prediction data: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching weather for prediction:", error);
            return null;
        }
    }
}
