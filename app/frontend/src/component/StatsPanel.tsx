import React from "react";
import type { Ligne, Arret } from "../../../backend/src/Model/Model.ts";
import { PredictionService } from "../services/PredictionService.tsx";
import { StatsService } from "../services/StatsService.tsx";
import { WeatherService } from "../services/WeatherService.tsx";
import styles from "./StatsPanel.module.css";

type Props = {
    selectedLineIds: Set<number>;
    lineIds: number[];
    linesById: Record<number, Ligne>;
    stopsById: Record<number, Arret>;
};

type IncidentType = "Safety" | "Operational" | "Technical" | "External" | "Other";

interface IncidentPrediction {
    type: IncidentType;
    probability: number;
}

interface LinePrediction {
    lineId: number;
    riskScore: number;
    topIncident: IncidentType;
    topIncidentProbability: number;
    predictedDelay?: number;
    isLoading?: boolean;
}

const generateLinePrediction = (lineId: number): LinePrediction => {
    const seed = lineId * 137;
    const riskScore = ((seed % 70) + 10) / 100;
    
    const incidents: IncidentType[] = ["Safety", "Operational", "Technical", "External", "Other"];
    const topIncident = incidents[seed % incidents.length];
    const topIncidentProbability = ((seed % 50) + 30) / 100;
    
    return {
        lineId,
        riskScore,
        topIncident,
        topIncidentProbability,
    };
};

export default function StatsPanel({ selectedLineIds, lineIds, linesById, stopsById: _ }: Props) {
    const [isMobile, setIsMobile] = React.useState(false);
    const [realPredictions, setRealPredictions] = React.useState<Record<number, number>>({});
    const [loadingPredictions, setLoadingPredictions] = React.useState(false);
    const [incidentPredictions, setIncidentPredictions] = React.useState<IncidentPrediction[]>([]);
    const [topLinesData, setTopLinesData] = React.useState<Array<{ lineId: number; activityScore: number }>>([]);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    React.useEffect(() => {
        const loadGlobalStats = async () => {
            try {
                const stats = await StatsService.getGlobalStats();
                
                if (stats) {
                    setIncidentPredictions(stats.incidentPredictions.map(p => ({
                        type: p.type as IncidentType,
                        probability: p.probability,
                    })));
                    
                    setTopLinesData(stats.topLines.map(line => ({
                        lineId: line.lineId,
                        activityScore: line.activityScore,
                    })));
                }
            } catch (error) {
                console.error("Error loading global stats:", error);
            }
        };

        loadGlobalStats();
    }, []);

    React.useEffect(() => {
        const loadPredictions = async () => {
            if (selectedLineIds.size === 0) {
                setRealPredictions({});
                return;
            }

            setLoadingPredictions(true);
            const newPredictions: Record<number, number> = {};
            
            const weatherData = await WeatherService.getWeatherForPrediction();
            
            if (!weatherData) {
                console.error("Failed to get weather data for predictions");
                setLoadingPredictions(false);
                return;
            }

            const predictionData = {
                LOCAL_TIME: weatherData.LOCAL_TIME,
                WEEK_DAY: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                INCIDENT: "External",
                LOCAL_MONTH: weatherData.LOCAL_MONTH,
                LOCAL_DAY: weatherData.LOCAL_DAY,
                TEMP: weatherData.TEMP,
                DEW_POINT_TEMP: weatherData.DEW_POINT_TEMP,
                HUMIDEX: weatherData.HUMIDEX,
                PRECIP_AMOUNT: weatherData.PRECIP_AMOUNT,
                RELATIVE_HUMIDITY: weatherData.RELATIVE_HUMIDITY,
                STATION_PRESSURE: weatherData.STATION_PRESSURE,
                VISIBILITY: weatherData.VISIBILITY,
                WEATHER_ENG_DESC: weatherData.WEATHER_ENG_DESC,
                WIND_DIRECTION: weatherData.WIND_DIRECTION,
                WIND_SPEED: weatherData.WIND_SPEED,
            };

            for (const lineId of Array.from(selectedLineIds)) {
                const result = await PredictionService.getLinePrediction(lineId.toString(), predictionData);
                if (result.success && result.predictedDelay !== undefined) {
                    newPredictions[lineId] = result.predictedDelay;
                }
            }

            setRealPredictions(newPredictions);
            setLoadingPredictions(false);
        };

        loadPredictions();
    }, [selectedLineIds]);

    const selectedLinesCount = selectedLineIds.size;
    
    const displayedStopsCount = React.useMemo(() => {
        const stopIds = new Set<number>();
        Array.from(selectedLineIds).forEach((lineId) => {
            const line = linesById[lineId];
            if (line?.stopIds) {
                line.stopIds.forEach((sid) => stopIds.add(sid));
            }
        });
        return stopIds.size;
    }, [selectedLineIds, linesById]);
    
    const linePredictions = React.useMemo(() => {
        return Array.from(selectedLineIds)
            .map((lineId) => {
                const mockPrediction = generateLinePrediction(lineId);
                return {
                    ...mockPrediction,
                    predictedDelay: realPredictions[lineId],
                    isLoading: loadingPredictions && !realPredictions[lineId],
                };
            })
            .sort((a, b) => b.riskScore - a.riskScore);
    }, [selectedLineIds, realPredictions, loadingPredictions]);

    const chartData = React.useMemo(() => {
        if (topLinesData.length > 0) {
            const maxScore = Math.max(...topLinesData.map(line => line.activityScore), 1);
            return topLinesData.slice(0, 5).map(line => ({
                id: line.lineId,
                value: (line.activityScore / maxScore) * 70,
            }));
        } else {
            const topLines = lineIds.slice(0, 5);
            return topLines.map((id) => ({
                id,
                value: ((id * 17) % 50) + 20,
            }));
        }
    }, [topLinesData, lineIds]);

    const containerClass = isMobile ? `${styles.container} ${styles.mobile}` : `${styles.container} ${styles.desktop}`;

    return (
        <aside className={containerClass} aria-label="Panneau de statistiques">
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>📊 Statistiques</h2>
            </div>

            <div className={styles.scrollableContent}>
                <section aria-labelledby="global-viz-title">
                    <h3 id="global-viz-title" className={styles.sectionTitle}>
                        Visualisation globale
                    </h3>
                    
                    <div className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.blue}`}>
                            <div className={styles.kpiLabel}>Bus visibles</div>
                            <div className={`${styles.kpiValue} ${styles.blue}`}>-</div>
                        </div>
                        
                        <div className={`${styles.kpiCard} ${styles.green}`}>
                            <div className={styles.kpiLabel}>Lignes sélectionnées</div>
                            <div className={`${styles.kpiValue} ${styles.green}`}>{selectedLinesCount}</div>
                        </div>
                        
                        <div className={`${styles.kpiCard} ${styles.orange} ${styles.fullWidth}`}>
                            <div className={styles.kpiLabel}>Arrêts affichés</div>
                            <div className={`${styles.kpiValue} ${styles.orange}`}>{displayedStopsCount}</div>
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <div className={styles.chartTitle}>Activité par ligne (Top 5)</div>
                        <svg width="100%" height="120" viewBox="0 0 320 120" aria-label="Bar chart of line activity">
                            {chartData.map((item, index) => {
                                const barWidth = 50;
                                const spacing = 64;
                                const x = index * spacing;
                                const maxHeight = 80;
                                const barHeight = (item.value / 70) * maxHeight;
                                const y = 100 - barHeight;
                                
                                return (
                                    <g key={item.id}>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={barHeight}
                                            fill="rgb(99, 102, 241)"
                                            opacity="0.7"
                                            rx="3"
                                        />
                                        <text
                                            x={x + barWidth / 2}
                                            y="115"
                                            textAnchor="middle"
                                            fontSize="11"
                                            fill="currentColor"
                                            opacity="0.6"
                                        >
                                            {item.id}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </section>

                <section aria-labelledby="incident-pred-title">
                    <h3 id="incident-pred-title" className={styles.sectionTitle}>
                        Prédiction par type d'incidents
                    </h3>
                    
                    <div className={styles.incidentList}>
                        {incidentPredictions.map((pred) => {
                            const percentage = Math.round(pred.probability * 100);
                            const colorMap: Record<IncidentType, string> = {
                                Safety: "safety",
                                Operational: "operational",
                                Technical: "technical",
                                External: "external",
                                Other: "other",
                            };
                            const colorClass = colorMap[pred.type];
                            
                            return (
                                <div key={pred.type}>
                                    <div className={styles.incidentHeader}>
                                        <span className={styles.incidentType}>{pred.type}</span>
                                        <span className={`${styles.incidentPercentage} ${styles[colorClass]}`}>{percentage}%</span>
                                    </div>
                                    <div
                                        className={styles.progressBar}
                                        role="progressbar"
                                        aria-valuenow={percentage}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${pred.type} incident probability: ${percentage}%`}
                                    >
                                        <div
                                            className={`${styles.progressBarFill} ${styles[colorClass]}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section aria-labelledby="line-pred-title">
                    <h3 id="line-pred-title" className={styles.sectionTitle}>
                        Prédictions par ligne
                    </h3>
                    
                    {selectedLineIds.size === 0 ? (
                        <div className={styles.emptyState}>
                            Sélectionnez une ligne pour voir les prédictions
                        </div>
                    ) : (
                        <div className={styles.linePredictionList}>
                            {linePredictions.map((pred) => {
                                const riskPercentage = Math.round(pred.riskScore * 100);
                                const incidentPercentage = Math.round(pred.topIncidentProbability * 100);
                                
                                const getRiskColorClass = (score: number) => {
                                    if (score >= 0.6) return "high";
                                    if (score >= 0.4) return "medium";
                                    return "low";
                                };
                                
                                const colorClass = getRiskColorClass(pred.riskScore);
                                
                                return (
                                    <div key={pred.lineId} className={styles.linePredictionCard}>
                                        <div className={styles.linePredictionHeader}>
                                            <span className={styles.lineName}>Ligne {pred.lineId}</span>
                                            <span className={`${styles.riskScore} ${styles[colorClass]}`}>
                                                {riskPercentage}%
                                            </span>
                                        </div>
                                        <div className={styles.topIncident}>
                                            Top incident: {pred.topIncident} ({incidentPercentage}%)
                                        </div>
                                        {pred.isLoading ? (
                                            <div className={styles.predictionDelay}>
                                                Chargement de la prédiction...
                                            </div>
                                        ) : pred.predictedDelay !== undefined ? (
                                            <div className={styles.predictionDelay}>
                                                Retard prédit: {Math.round(pred.predictedDelay)} min
                                            </div>
                                        ) : null}
                                        <div
                                            className={styles.riskProgressBar}
                                            role="progressbar"
                                            aria-valuenow={riskPercentage}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`Risk score for line ${pred.lineId}: ${riskPercentage}%`}
                                        >
                                            <div
                                                className={`${styles.riskProgressBarFill} ${styles[colorClass]}`}
                                                style={{ width: `${riskPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </aside>
    );
}
