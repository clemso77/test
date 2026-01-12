import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { getPrediction } from './predictionService';
import { getWeatherForPrediction } from './weatherService';

interface IncidentData {
    Route: string;
    Incident: string;
    'Min Delay': string;
}

interface LineActivity {
    lineId: number;
    activityScore: number;
    incidentCount: number;
}

interface IncidentTypePrediction {
    type: string;
    probability: number;
}

let cachedStats: {
    lineActivities: LineActivity[];
    incidentTypes: Map<string, number>;
} | null = null;

let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache

/**
 * Load and analyze incident data from the dataset
 */
async function loadIncidentData(): Promise<void> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedStats && (now - cacheTimestamp) < CACHE_DURATION) {
        return;
    }

    try {
        // Read the preprocessed dataset
        const dataPath = path.join(__dirname, '../../../../data/1_raw_dataset.csv');
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        
        const records: IncidentData[] = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
        });

        // Analyze line activities
        const lineStats = new Map<number, { count: number; totalDelay: number }>();
        const incidentTypeCount = new Map<string, number>();

        for (const record of records) {
            const lineId = parseInt(record.Route);
            const delay = parseFloat(record['Min Delay']) || 0;
            const incident = record.Incident || 'Other';

            if (!isNaN(lineId)) {
                // Track line activity
                const current = lineStats.get(lineId) || { count: 0, totalDelay: 0 };
                lineStats.set(lineId, {
                    count: current.count + 1,
                    totalDelay: current.totalDelay + delay,
                });

                // Track incident types
                const incidentType = normalizeIncidentType(incident);
                incidentTypeCount.set(incidentType, (incidentTypeCount.get(incidentType) || 0) + 1);
            }
        }

        // Calculate activity scores
        const lineActivities: LineActivity[] = Array.from(lineStats.entries()).map(([lineId, stats]) => ({
            lineId,
            activityScore: stats.count * 0.6 + stats.totalDelay * 0.4, // Weighted score
            incidentCount: stats.count,
        }));

        // Sort by activity score
        lineActivities.sort((a, b) => b.activityScore - a.activityScore);

        cachedStats = {
            lineActivities,
            incidentTypes: incidentTypeCount,
        };
        cacheTimestamp = now;
    } catch (error) {
        console.error('Error loading incident data:', error);
        // Provide default data if loading fails
        cachedStats = {
            lineActivities: [],
            incidentTypes: new Map(),
        };
    }
}

/**
 * Normalize incident type to match prediction system categories
 */
function normalizeIncidentType(incident: string): string {
    const incidentLower = incident.toLowerCase();
    
    if (incidentLower.includes('security') || incidentLower.includes('safety')) {
        return 'Safety';
    } else if (incidentLower.includes('mechanical') || incidentLower.includes('technical')) {
        return 'Technical';
    } else if (incidentLower.includes('operator') || incidentLower.includes('operations')) {
        return 'Operational';
    } else if (incidentLower.includes('diversion') || incidentLower.includes('collision') || 
               incidentLower.includes('emergency') || incidentLower.includes('weather')) {
        return 'External';
    } else {
        return 'Other';
    }
}

/**
 * Get top N most active bus lines
 */
export async function getTopLines(count: number = 5): Promise<LineActivity[]> {
    await loadIncidentData();
    
    if (!cachedStats) {
        return [];
    }

    return cachedStats.lineActivities.slice(0, count);
}

/**
 * Get incident type predictions using the prediction system
 * This calculates predictions for each incident type using real weather data
 */
export async function getIncidentTypePredictions(): Promise<IncidentTypePrediction[]> {
    await loadIncidentData();
    
    if (!cachedStats) {
        return getDefaultIncidentPredictions();
    }

    try {
        // Get current weather data for prediction
        const weatherData = await getWeatherForPrediction();
        
        // Define incident types to predict
        const incidentTypes = ['Safety', 'Operational', 'Technical', 'External', 'Other'];
        const predictions: { type: string; delay: number }[] = [];

        // Get current day of week
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const currentDay = days[new Date().getDay()];

        // Get predictions for each incident type using a representative line (line 91)
        for (const incidentType of incidentTypes) {
            const predictionInput = {
                ROUTE: 91, // Use a representative line
                ...weatherData,
                WEEK_DAY: currentDay,
                INCIDENT: incidentType,
            };

            const predictedDelay = await getPrediction(predictionInput);
            predictions.push({
                type: incidentType,
                delay: predictedDelay || 0,
            });
        }

        // Calculate total delay
        const totalDelay = predictions.reduce((sum, p) => sum + p.delay, 0);

        // Convert delays to probabilities (higher delay = higher probability)
        if (totalDelay === 0) {
            return getDefaultIncidentPredictions();
        }

        const result = predictions.map(p => ({
            type: p.type,
            probability: p.delay / totalDelay,
        }));

        // Ensure probabilities sum to 1.0
        const sum = result.reduce((s, r) => s + r.probability, 0);
        return result.map(r => ({
            type: r.type,
            probability: r.probability / sum,
        }));
    } catch (error) {
        console.error('Error getting incident predictions:', error);
        return getDefaultIncidentPredictions();
    }
}

/**
 * Get default incident predictions based on historical data
 */
function getDefaultIncidentPredictions(): IncidentTypePrediction[] {
    if (!cachedStats) {
        return [
            { type: 'Safety', probability: 0.15 },
            { type: 'Operational', probability: 0.35 },
            { type: 'Technical', probability: 0.25 },
            { type: 'External', probability: 0.18 },
            { type: 'Other', probability: 0.07 },
        ];
    }

    // Calculate probabilities from actual incident counts
    const total = Array.from(cachedStats.incidentTypes.values()).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        return getDefaultIncidentPredictions();
    }

    const incidentTypes = ['Safety', 'Operational', 'Technical', 'External', 'Other'];
    const result = incidentTypes.map(type => ({
        type,
        probability: (cachedStats!.incidentTypes.get(type) || 0) / total,
    }));

    // Ensure probabilities sum to 1.0
    const sum = result.reduce((s, r) => s + r.probability, 0);
    return result.map(r => ({
        type: r.type,
        probability: sum > 0 ? r.probability / sum : 0.2, // Equal distribution if no data
    }));
}

/**
 * Get global statistics
 */
export async function getGlobalStats() {
    await loadIncidentData();
    
    const topLines = await getTopLines(5);
    const incidentPredictions = await getIncidentTypePredictions();

    return {
        topLines,
        incidentPredictions,
        totalIncidents: cachedStats?.lineActivities.reduce((sum, line) => sum + line.incidentCount, 0) || 0,
    };
}