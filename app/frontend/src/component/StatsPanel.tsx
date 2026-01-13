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

const INCIDENT_TYPES = ["Safety", "Operational", "Technical", "External", "Other"] as const;
type IncidentType = typeof INCIDENT_TYPES[number];

const MAX_DELAY = 120; // Maximum expected delay in minutes for normalization

interface IncidentPrediction {
    type: IncidentType;
    probability: number;
}

interface LinePrediction {
    lineId: number;
    riskScore: number;
    topIncident: IncidentType;
    predictedDelay: number;
    byIncident: Record<IncidentType, number>;
    isLoading: boolean;
    error?: string;
}

export default function StatsPanel({ selectedLineIds, linesById }: Props) {
    const [isMobile, setIsMobile] = React.useState(false);
    const [linePredictions, setLinePredictions] = React.useState<Record<number, LinePrediction>>({});
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
                
                if (stats && stats.topLines && stats.topLines.length > 0) {
                    setTopLinesData(stats.topLines.map(line => ({
                        lineId: line.lineId,
                        activityScore: line.activityScore,
                    })));
                } else {
                    setTopLinesData([]);
                }
            } catch (error) {
                console.error("Error loading global stats:", error);
                setTopLinesData([]);
            }
        };

        loadGlobalStats();
    }, []);

    // Calculate incident predictions from selected lines
    React.useEffect(() => {
        if (selectedLineIds.size === 0) {
            setIncidentPredictions([]);
            return;
        }

        // Calculate average delay per incident type across all selected lines
        const selectedPredictions = Array.from(selectedLineIds)
            .map(lineId => linePredictions[lineId])
            .filter(pred => pred && !pred.isLoading && !pred.error);

        if (selectedPredictions.length === 0) {
            setIncidentPredictions([]);
            return;
        }

        const incidentTotals: Record<IncidentType, number> = {
            Safety: 0,
            Operational: 0,
            Technical: 0,
            External: 0,
            Other: 0,
        };

        // Sum delays for each incident type
        selectedPredictions.forEach(pred => {
            INCIDENT_TYPES.forEach(incidentType => {
                incidentTotals[incidentType] += pred.byIncident[incidentType];
            });
        });

        // Calculate average and normalize
        const maxTotal = Math.max(...Object.values(incidentTotals), 1);
        
        const predictions: IncidentPrediction[] = INCIDENT_TYPES.map(incidentType => ({
            type: incidentType,
            probability: incidentTotals[incidentType] / maxTotal,
        }));

        setIncidentPredictions(predictions);
    }, [selectedLineIds, linePredictions]);

    React.useEffect(() => {
        let isCancelled = false;

        const loadPredictions = async () => {
            if (selectedLineIds.size === 0) {
                setLinePredictions({});
                return;
            }

            // Initialize predictions as loading
            const initialPredictions: Record<number, LinePrediction> = {};
            Array.from(selectedLineIds).forEach(lineId => {
                initialPredictions[lineId] = {
                    lineId,
                    riskScore: 0,
                    topIncident: "Other",
                    predictedDelay: 0,
                    byIncident: {
                        Safety: 0,
                        Operational: 0,
                        Technical: 0,
                        External: 0,
                        Other: 0,
                    },
                    isLoading: true,
                };
            });
            setLinePredictions(initialPredictions);

            // Get weather data
            const weatherData = await WeatherService.getWeatherForPrediction();
            
            if (!weatherData) {
                console.error("Failed to get weather data for predictions");
                if (isCancelled) return;
                
                // Mark all as error
                const errorPredictions: Record<number, LinePrediction> = {};
                Array.from(selectedLineIds).forEach(lineId => {
                    errorPredictions[lineId] = {
                        lineId,
                        riskScore: 0,
                        topIncident: "Other",
                        predictedDelay: 0,
                        byIncident: {
                            Safety: 0,
                            Operational: 0,
                            Technical: 0,
                            External: 0,
                            Other: 0,
                        },
                        isLoading: false,
                        error: "Weather data unavailable",
                    };
                });
                setLinePredictions(errorPredictions);
                return;
            }

            // Process each line
            const newPredictions: Record<number, LinePrediction> = {};
            
            for (const lineId of Array.from(selectedLineIds)) {
                if (isCancelled) return;

                try {
                    const byIncident: Record<IncidentType, number> = {
                        Safety: 0,
                        Operational: 0,
                        Technical: 0,
                        External: 0,
                        Other: 0,
                    };

                    // Make 5 API calls in parallel (one per incident type)
                    const predictionPromises = INCIDENT_TYPES.map(async (incidentType) => {
                        const predictionData = {
                            LOCAL_TIME: weatherData.LOCAL_TIME,
                            WEEK_DAY: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                            INCIDENT: incidentType,
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

                        const result = await PredictionService.getLinePrediction(lineId.toString(), predictionData);
                        
                        if (result.success && result.predictedDelay !== undefined) {
                            return { incidentType, delay: result.predictedDelay };
                        }
                        return { incidentType, delay: 0 };
                    });

                    const results = await Promise.all(predictionPromises);
                    
                    if (isCancelled) return;

                    // Fill byIncident map
                    results.forEach(({ incidentType, delay }) => {
                        byIncident[incidentType] = delay;
                    });

                    // Calculate predictedDelay as max
                    const predictedDelay = Math.max(...Object.values(byIncident));

                    // Calculate topIncident (argmax, with tie-breaking by order in INCIDENT_TYPES)
                    let topIncident: IncidentType = "Other";
                    let maxDelay = -1;
                    for (const incidentType of INCIDENT_TYPES) {
                        if (byIncident[incidentType] > maxDelay) {
                            maxDelay = byIncident[incidentType];
                            topIncident = incidentType;
                        }
                    }

                    // Calculate riskScore (normalized, clamped to 0..1)
                    const riskScore = Math.min(Math.max(predictedDelay / MAX_DELAY, 0), 1);

                    newPredictions[lineId] = {
                        lineId,
                        riskScore,
                        topIncident,
                        predictedDelay,
                        byIncident,
                        isLoading: false,
                    };
                } catch (error) {
                    console.error(`Error loading predictions for line ${lineId}:`, error);
                    newPredictions[lineId] = {
                        lineId,
                        riskScore: 0,
                        topIncident: "Other",
                        predictedDelay: 0,
                        byIncident: {
                            Safety: 0,
                            Operational: 0,
                            Technical: 0,
                            External: 0,
                            Other: 0,
                        },
                        isLoading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    };
                }
            }

            if (!isCancelled) {
                setLinePredictions(newPredictions);
            }
        };

        loadPredictions();

        return () => {
            isCancelled = true;
        };
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
    
    const displayedLinePredictions = React.useMemo(() => {
        return Array.from(selectedLineIds)
            .map((lineId) => linePredictions[lineId])
            .filter((pred): pred is LinePrediction => pred !== undefined)
            .sort((a, b) => b.riskScore - a.riskScore);
    }, [selectedLineIds, linePredictions]);

    const chartData = React.useMemo(() => {
        if (topLinesData.length > 0) {
            const maxScore = Math.max(...topLinesData.map(line => line.activityScore), 1);
            return topLinesData.slice(0, 5).map(line => ({
                id: line.lineId,
                value: (line.activityScore / maxScore) * 70,
            }));
        }
        return [];
    }, [topLinesData]);

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
                        {chartData.length > 0 ? (
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
                        ) : (
                            <div className={styles.emptyState}>
                                Données indisponibles
                            </div>
                        )}
                    </div>
                </section>

                <section aria-labelledby="incident-pred-title">
                    <h3 id="incident-pred-title" className={styles.sectionTitle}>
                        Prédiction par type d'incidents
                    </h3>
                    
                    {incidentPredictions.length > 0 ? (
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
                    ) : (
                        <div className={styles.emptyState}>
                            Sélectionnez une ligne pour voir les prédictions
                        </div>
                    )}
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
                            {displayedLinePredictions.map((pred) => {
                                const riskPercentage = Math.round(pred.riskScore * 100);
                                
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
                                        {pred.isLoading ? (
                                            <div className={styles.predictionDelay}>
                                                Chargement de la prédiction...
                                            </div>
                                        ) : pred.error ? (
                                            <div className={styles.predictionDelay}>
                                                Erreur: {pred.error}
                                            </div>
                                        ) : (
                                            <>
                                                <div className={styles.topIncident}>
                                                    Top incident: {pred.topIncident}
                                                </div>
                                                <div className={styles.predictionDelay}>
                                                    Retard prédit: {Math.round(pred.predictedDelay)} min
                                                </div>
                                            </>
                                        )}
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
