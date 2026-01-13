const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export interface LineActivity {
    lineId: number;
    activityScore: number;
    incidentCount: number;
}

export interface IncidentTypePrediction {
    type: string;
    probability: number;
}

export interface GlobalStats {
    topLines: LineActivity[];
    incidentPredictions: IncidentTypePrediction[];
    totalIncidents: number;
}

export class StatsService {
    static async getGlobalStats(): Promise<GlobalStats | null> {
        try {
            const response = await fetch(`${API_BASE}/stats/global`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch global stats: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching global stats:', error);
            return null;
        }
    }

    static async getTopLines(count = 5): Promise<LineActivity[]> {
        try {
            const response = await fetch(`${API_BASE}/stats/top-lines?count=${count}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch top lines: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching top lines:', error);
            return [];
        }
    }

    static async getIncidentTypePredictions(): Promise<IncidentTypePrediction[]> {
        try {
            const response = await fetch(`${API_BASE}/stats/incident-predictions`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch incident predictions: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching incident predictions:', error);
            return [];
        }
    }
}
