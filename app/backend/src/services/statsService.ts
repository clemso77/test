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

let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000;

async function loadIncidentData(): Promise<void> {
    const now = Date.now();
    
    if (cachedStats && (now - cacheTimestamp) < CACHE_DURATION) {
        return;
    }

    try {
        const dataDir = process.env.DATA_DIR || '../../../../data';
        const dataPath = path.join(__dirname, dataDir, '1_raw_dataset.csv');
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        
        const records: IncidentData[] = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
        });

        const lineStats = new Map<number, { count: number; totalDelay: number }>();
        const incidentTypeCount = new Map<string, number>();

        for (const record of records) {
            const lineId = parseInt(record.Route);
            const delay = parseFloat(record['Min Delay']) || 0;
            const incident = record.Incident || 'Other';

            if (!isNaN(lineId)) {
                const current = lineStats.get(lineId) || { count: 0, totalDelay: 0 };
                lineStats.set(lineId, {
                    count: current.count + 1,
                    totalDelay: current.totalDelay + delay,
                });

                const incidentType = normalizeIncidentType(incident);
                incidentTypeCount.set(incidentType, (incidentTypeCount.get(incidentType) || 0) + 1);
            }
        }

        const lineActivities: LineActivity[] = Array.from(lineStats.entries()).map(([lineId, stats]) => ({
            lineId,
            activityScore: stats.count * 0.6 + stats.totalDelay * 0.4,
            incidentCount: stats.count,
        }));

        lineActivities.sort((a, b) => b.activityScore - a.activityScore);

        cachedStats = {
            lineActivities,
            incidentTypes: incidentTypeCount,
        };
        cacheTimestamp = now;
    } catch (error) {
        console.error('Error loading incident data:', error);
        cachedStats = {
            lineActivities: [],
            incidentTypes: new Map(),
        };
    }
}

function normalizeIncidentType(incident: string): string {
    const lower = incident.toLowerCase();
    
    if (lower.includes('security') || lower.includes('safety')) return 'Safety';
    if (lower.includes('mechanical') || lower.includes('technical')) return 'Technical';
    if (lower.includes('operator') || lower.includes('operations')) return 'Operational';
    if (lower.includes('diversion') || lower.includes('collision') || 
        lower.includes('emergency') || lower.includes('weather')) return 'External';
    
    return 'Other';
}

export async function getTopLines(count = 5): Promise<LineActivity[]> {
    await loadIncidentData();
    return cachedStats ? cachedStats.lineActivities.slice(0, count) : [];
}

export async function getIncidentTypePredictions(): Promise<IncidentTypePrediction[]> {
    await loadIncidentData();
    
    if (!cachedStats) {
        return historicalDistribution();
    }

    try {
        const weatherData = await getWeatherForPrediction();
        const incidentTypes = ['Safety', 'Operational', 'Technical', 'External', 'Other'];
        const predictions: { type: string; delay: number }[] = [];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        const baselineLine = parseInt(process.env.BASELINE_LINE_FOR_PREDICTIONS || '91');

        for (const incidentType of incidentTypes) {
            const input = {
                ROUTE: baselineLine,
                ...weatherData,
                WEEK_DAY: currentDay,
                INCIDENT: incidentType,
            };

            const delay = await getPrediction(input);
            predictions.push({ type: incidentType, delay: delay || 0 });
        }

        const totalDelay = predictions.reduce((sum, p) => sum + p.delay, 0);

        if (totalDelay === 0 || predictions.every(p => p.delay === 0)) {
            return historicalDistribution();
        }

        const normalized = predictions.map(p => ({
            type: p.type,
            probability: p.delay / totalDelay,
        }));

        const sum = normalized.reduce((s, r) => s + r.probability, 0);
        return normalized.map(r => ({
            type: r.type,
            probability: r.probability / sum,
        }));
    } catch (error) {
        console.error('Error in incident predictions:', error);
        return historicalDistribution();
    }
}

function historicalDistribution(): IncidentTypePrediction[] {
    if (!cachedStats || cachedStats.incidentTypes.size === 0) {
        return [
            { type: 'Safety', probability: 0.15 },
            { type: 'Operational', probability: 0.35 },
            { type: 'Technical', probability: 0.25 },
            { type: 'External', probability: 0.18 },
            { type: 'Other', probability: 0.07 },
        ];
    }

    const total = Array.from(cachedStats.incidentTypes.values()).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        return historicalDistribution();
    }

    const incidentTypes = ['Safety', 'Operational', 'Technical', 'External', 'Other'];
    const result = incidentTypes.map(type => ({
        type,
        probability: (cachedStats!.incidentTypes.get(type) || 0) / total,
    }));

    const sum = result.reduce((s, r) => s + r.probability, 0);
    return result.map(r => ({
        type: r.type,
        probability: sum > 0 ? r.probability / sum : 0.2,
    }));
}

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