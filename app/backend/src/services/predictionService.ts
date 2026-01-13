import {PredictionInput} from "../Model/Model";
const API_URL = process.env.PREDICTION_API_URL || 'http://localhost:4000';


export async function getPrediction(data: PredictionInput): Promise<number | null> {
   return null;
}
