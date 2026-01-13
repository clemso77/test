import {LinePrediction} from "../Model/Model";


const CACHE_DURATION = 30 * 60 * 1000;
let cacheTimestamp = 0;

function normalizeIncidentType(incident: string): string {
    const lower = incident.toLowerCase();
    
    if (lower.includes('security') || lower.includes('safety')) return 'Safety';
    if (lower.includes('mechanical') || lower.includes('technical')) return 'Technical';
    if (lower.includes('operator') || lower.includes('operations')) return 'Operational';
    if (lower.includes('diversion') || lower.includes('collision') || 
        lower.includes('emergency') || lower.includes('weather')) return 'External';
    
    return 'Other';
}

export async function getIncidentTypePredictions(): Promise<LinePrediction[] | null> {
    return null;
}