// src/services/predictionService.ts

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

/**
 * Call the Python prediction API to get delay prediction
 * @param data - Input data with weather and temporal features
 * @returns Predicted delay in minutes
 */
export async function getPrediction(data: PredictionInput): Promise<number | null> {
    try {
        const predictionApiUrl = process.env.PREDICTION_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${predictionApiUrl}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Prediction API error:', errorData);
            return null;
        }

        const result: PredictionResponse = await response.json();
        
        if (result.success && result.prediction !== undefined) {
            return result.prediction;
        } else {
            console.error('Prediction failed:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error calling prediction API:', error);
        return null;
    }
}

/**
 * Check if the prediction API is healthy
 * @returns true if API is healthy, false otherwise
 */
export async function checkPredictionApiHealth(): Promise<boolean> {
    try {
        const predictionApiUrl = process.env.PREDICTION_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${predictionApiUrl}/health`);
        
        if (response.ok) {
            const data = await response.json();
            return data.status === 'healthy';
        }
        return false;
    } catch (error) {
        console.error('Prediction API health check failed:', error);
        return false;
    }
}
