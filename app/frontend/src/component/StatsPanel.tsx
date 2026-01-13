import React from "react";
import styles from "./StatsPanel.module.css";
import type {IncidentType, Ligne, PredictionOutput} from "../../../backend/src/Model/Model.ts";
import type {LinePrediction} from "../../../backend/src/Model/Model.ts";
import {PredictionService} from "../services/PredictionService.tsx";

type Props = {
    selectedLineIds: Set<number>;
    linesById: Record<number, Ligne>;
};

export default function StatsPanel({ selectedLineIds, linesById }: Props) {
    const [linePredictions, setLinePredictions] = React.useState<Record<number, LinePrediction>>()
    const [topLinesData, setTopLinesData] = React.useState<Array<{lineId: number, activityScore: number}>>()
    const [incidentPredictions, setIncidentPredictions] = React.useState<Array<{type: IncidentType, probability: number}>>()

    // Lecture des predictions par ligne selectionner
    React.useEffect(() => {
        const chargement = async () => {
            if (selectedLineIds.size === 0) return;
            const newPredictions: Record<number, LinePrediction> = {};
            for(const lineId of selectedLineIds) {
                const linePrediction: PredictionOutput[] = [];
                for(const ic of ["Safety", "Operational", "Technical", "External", "Other"]) {
                    const result = await PredictionService.getLinePrediction(lineId.toString(), ic as IncidentType);
                    console.log("Prediction:", result);
                    if(result && result.status == 200) {
                        linePrediction.push(result);
                    }
                }
                if(linePrediction.length > 0) {
                    let delayTotal = 0;
                    const byIncident: Record<IncidentType, number> = {
                        Safety: 0,
                        Operational: 0,
                        Technical: 0,
                        External: 0,
                        Other: 0
                    };
                    
                    for(const prediction of linePrediction) {
                        byIncident[prediction.incident] += prediction.prediction;
                        delayTotal += prediction.prediction;
                    }

                    // Find the incident type with the highest delay
                    let topIncident: IncidentType = "Other";
                    let maxDelay = 0;
                    Object.entries(byIncident).forEach(([incident, delay]) => {
                        if (delay > maxDelay) {
                            maxDelay = delay;
                            topIncident = incident as IncidentType;
                        }
                    });

                    const lp: LinePrediction = {
                        lineId: lineId,
                        isLoading: false,
                        predictedDelay: delayTotal,
                        byIncident: byIncident,
                        topIncident: topIncident
                    };
                    newPredictions[lineId] = lp;
                }
            }
            setLinePredictions(newPredictions);
        };
        chargement();
    }, [selectedLineIds])

    // Calculate aggregated statistics from line predictions
    React.useEffect(() => {
        if (!linePredictions || Object.keys(linePredictions).length === 0) {
            setTopLinesData([]);
            setIncidentPredictions([]);
            return;
        }

        // Calculate top 5 lines by predicted delay
        const lineDelays = Object.values(linePredictions)
            .filter(lp => !lp.isLoading && !lp.error)
            .map(lp => ({
                lineId: lp.lineId,
                activityScore: lp.predictedDelay
            }))
            .sort((a, b) => b.activityScore - a.activityScore)
            .slice(0, 5);
        
        setTopLinesData(lineDelays);

        // Calculate percentage of delay time by incident type
        const incidentTotals: Record<IncidentType, number> = {
            Safety: 0,
            Operational: 0,
            Technical: 0,
            External: 0,
            Other: 0
        };

        let totalDelay = 0;
        Object.values(linePredictions).forEach(lp => {
            if (!lp.isLoading && !lp.error) {
                // Accumulate incident totals
                Object.entries(lp.byIncident).forEach(([incident, delay]) => {
                    incidentTotals[incident as IncidentType] += delay;
                });
                // Add this line's total delay to the overall total
                totalDelay += lp.predictedDelay;
            }
        });

        const incidentPercentages = Object.entries(incidentTotals).map(([type, total]) => ({
            type: type as IncidentType,
            probability: totalDelay > 0 ? total / totalDelay : 0
        }));

        setIncidentPredictions(incidentPercentages);
    }, [linePredictions]);

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
        if (!linePredictions) return [];
        return Array.from(selectedLineIds)
            .map((lineId) => linePredictions[lineId])
            .filter((pred): pred is LinePrediction => pred !== undefined)
            .sort((a, b) => b.predictedDelay - a.predictedDelay);
    }, [selectedLineIds, linePredictions]);

    const chartData = React.useMemo(() => {
        if (!topLinesData) return [];
        if (topLinesData.length > 0) {
            const maxScore = Math.max(...topLinesData.map(line => line.activityScore), 1);
            return topLinesData.slice(0, 5).map(line => ({
                id: line.lineId,
                value: (line.activityScore / maxScore) * 70,
            }));
        }
        return [];
    }, [topLinesData]);

    const containerClass = `${styles.container} ${styles.desktop}`;

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
                        <div className={styles.chartTitle}>Top 5 lignes - Temps d'attente (min)</div>
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
                        % de temps par type d'incident
                    </h3>

                    {incidentPredictions && incidentPredictions.length > 0 ? (
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
                                const delayMinutes = Math.round(pred.predictedDelay);

                                const getDelayColorClass = (delay: number) => {
                                    if (delay >= 20) return "high";
                                    if (delay >= 10) return "medium";
                                    return "low";
                                };

                                const colorClass = getDelayColorClass(delayMinutes);

                                return (
                                    <div key={pred.lineId} className={styles.linePredictionCard}>
                                        <div className={styles.linePredictionHeader}>
                                            <span className={styles.lineName}>Ligne {pred.lineId}</span>
                                            <span className={`${styles.riskScore} ${styles[colorClass]}`}>
                                                {delayMinutes} min
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
                                                    Top incident: {pred.topIncident || "N/A"}
                                                </div>
                                                <div className={styles.predictionDelay}>
                                                    Retard prédit: {delayMinutes} min
                                                </div>
                                            </>
                                        )}
                                        <div
                                            className={styles.riskProgressBar}
                                            role="progressbar"
                                            aria-valuenow={Math.min(delayMinutes, 50)}
                                            aria-valuemin={0}
                                            aria-valuemax={50}
                                            aria-label={`Predicted delay for line ${pred.lineId}: ${delayMinutes} minutes`}
                                        >
                                            <div
                                                className={`${styles.riskProgressBarFill} ${styles[colorClass]}`}
                                                // Progress bar width: delayMinutes * 2 maps 0-50min delays to 0-100% bar width
                                                // Capped at 100% for delays exceeding 50 minutes
                                                style={{ width: `${Math.min(delayMinutes * 2, 100)}%` }}
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
