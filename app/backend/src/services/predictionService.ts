interface PredictionInput {
    ROUTE?: number;
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

interface PredictionResponse {
    success: boolean;
    prediction?: number;
    error?: string;
}

const API_URL = process.env.PREDICTION_API_URL || 'http://localhost:5000';

export async function getPrediction(data: PredictionInput): Promise<number | null> {
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error('Prediction API error:', await response.json());
            return null;
        }

        const result: PredictionResponse = await response.json();
        return result.success && result.prediction !== undefined ? result.prediction : null;
    } catch (error) {
        console.error('Prediction API call failed:', error);
        return null;
    }
}

export async function checkPredictionApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            return data.status === 'healthy';
        }
        return false;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}
