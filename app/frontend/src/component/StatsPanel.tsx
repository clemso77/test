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
    const [loadingPrediction, setLoadingPrediction] = React.useState(false);

    // Lecture des predictions par ligne selectionner
    React.useEffect(() => {
        const chargement = async () => {
            if (selectedLineIds.size === 0) return;
            setLoadingPrediction(true);
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
                    const delayTotal=0;
                    const lp = {
                        lineId: lineId,
                        isLoading: loadingPrediction,
                        predictedDelay: delayTotal,
                        byIncident: {} as Record<IncidentType, number>,
                    } as LinePrediction;
                    for(const prediction of linePrediction) {
                        lp.byIncident[prediction.incident] = prediction.prediction;
                        lp.predictedDelay += prediction.prediction;
                    }
                    newPredictions[lineId] = lp;
                }
            }
            setLoadingPrediction(false);
            setLinePredictions(newPredictions);
        };
        chargement();
    }, [selectedLineIds])

    React.useEffect(() => {

        // fake data for test
        setIncidentPredictions([
            {type: "Safety", probability: 0.2},
            {type: "Operational", probability: 0.3},
            {type: "Technical", probability: 0.2},
            {type: "External", probability: 0.1},
            {type: "Other", probability: 0.1},
        ]);
        setLinePredictions({
            1: {
                lineId: 1,
                isLoading: false,
                error: undefined,
                topIncident: "Operational",
                predictedDelay: 10,
                riskScore: 0.5,
                byIncident: {
                    Safety: 0.1,
                    Operational: 0.8,
                    Technical: 0.05,
                    External: 0,
                    Other: 0
                }
            },
            2: {
                lineId: 2,
                isLoading: false,
                error: undefined,
                topIncident: "External",
                predictedDelay: 15,
                riskScore: 0.7,
                byIncident: {
                    Safety: 0.05,
                    Operational: 0.05,
                    Technical: 0.8,
                    External: 0.1,
                    Other: 0
                }
            }
        })
        setTopLinesData([
            {lineId: 1, activityScore: 50},
            {lineId: 2, activityScore: 70},
            {lineId: 3, activityScore: 30},
            {lineId: 4, activityScore: 90},
            {lineId: 5, activityScore: 60},
        ]);

    }, []);

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
            .sort((a, b) => b.riskScore - a.riskScore);
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
