import {PredictionInput} from "../Model/Model";
const API_URL = process.env.PREDICTION_API_URL || 'http://localhost:4000';


export async function getPrediction(data: PredictionInput): Promise<any | null> {
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

        const result = await response.json();
        console.log('Prediction result:', result);

        if (result.success && result.prediction !== undefined) {
            return result;
        } else {
            console.error('Prediction failed:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error calling prediction API:', error);
        return null;
    }
}
