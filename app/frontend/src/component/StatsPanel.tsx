import React from "react";
import type { Ligne, Arret } from "../../../backend/src/Model/Model.ts";
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
}

// Mock data generator for incident predictions
const generateIncidentPredictions = (): IncidentPrediction[] => {
    return [
        { type: "Safety", probability: 0.15 },
        { type: "Operational", probability: 0.35 },
        { type: "Technical", probability: 0.25 },
        { type: "External", probability: 0.18 },
        { type: "Other", probability: 0.07 },
    ];
};

// Mock data generator for line predictions
const generateLinePrediction = (lineId: number): LinePrediction => {
    const seed = lineId * 137; // Simple seed for stable random values
    const riskScore = ((seed % 70) + 10) / 100; // 10-80%
    
    const incidents: IncidentType[] = ["Safety", "Operational", "Technical", "External", "Other"];
    const topIncident = incidents[seed % incidents.length];
    const topIncidentProbability = ((seed % 50) + 30) / 100; // 30-80%
    
    return {
        lineId,
        riskScore,
        topIncident,
        topIncidentProbability,
    };
};

export default function StatsPanel({ selectedLineIds, lineIds, linesById, stopsById: _ }: Props) {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Calculate stats
    const selectedLinesCount = selectedLineIds.size;
    
    // Calculate displayed stops count
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

    // Mock data for incidents and line predictions
    const incidentPredictions = React.useMemo(() => generateIncidentPredictions(), []);
    
    const linePredictions = React.useMemo(() => {
        return Array.from(selectedLineIds)
            .map((lineId) => generateLinePrediction(lineId))
            .sort((a, b) => b.riskScore - a.riskScore);
    }, [selectedLineIds]);

    // Simple bar chart data for top 5 lines
    const chartData = React.useMemo(() => {
        const topLines = lineIds.slice(0, 5);
        return topLines.map((id) => ({
            id,
            value: ((id * 17) % 50) + 20, // Mock value 20-70
        }));
    }, [lineIds]);

    const containerClass = isMobile ? `${styles.container} ${styles.mobile}` : `${styles.container} ${styles.desktop}`;

    return (
        <aside className={containerClass} aria-label="Panneau de statistiques">
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>
                    📊 Statistiques
                </h2>
            </div>

            {/* Scrollable content */}
            <div className={styles.scrollableContent}>
                {/* Global Visualization Section */}
                <section aria-labelledby="global-viz-title">
                    <h3
                        id="global-viz-title"
                        className={styles.sectionTitle}
                    >
                        Visualisation globale
                    </h3>
                    
                    {/* KPI Cards */}
                    <div className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.blue}`}>
                            <div className={styles.kpiLabel}>Bus visibles</div>
                            <div className={`${styles.kpiValue} ${styles.blue}`}>
                                {/* Placeholder - could be calculated from real-time data */}
                                -
                            </div>
                        </div>
                        
                        <div className={`${styles.kpiCard} ${styles.green}`}>
                            <div className={styles.kpiLabel}>Lignes sélectionnées</div>
                            <div className={`${styles.kpiValue} ${styles.green}`}>
                                {selectedLinesCount}
                            </div>
                        </div>
                        
                        <div className={`${styles.kpiCard} ${styles.orange} ${styles.fullWidth}`}>
                            <div className={styles.kpiLabel}>Arrêts affichés</div>
                            <div className={`${styles.kpiValue} ${styles.orange}`}>
                                {displayedStopsCount}
                            </div>
                        </div>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className={styles.chartContainer}>
                        <div className={styles.chartTitle}>
                            Activité par ligne (Top 5)
                        </div>
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

                {/* Incident Type Predictions Section */}
                <section aria-labelledby="incident-pred-title">
                    <h3
                        id="incident-pred-title"
                        className={styles.sectionTitle}
                    >
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

                {/* Line Predictions Section */}
                <section aria-labelledby="line-pred-title">
                    <h3
                        id="line-pred-title"
                        className={styles.sectionTitle}
                    >
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
                                    <div
                                        key={pred.lineId}
                                        className={styles.linePredictionCard}
                                    >
                                        <div className={styles.linePredictionHeader}>
                                            <span className={styles.lineName}>Ligne {pred.lineId}</span>
                                            <span className={`${styles.riskScore} ${styles[colorClass]}`}>
                                                {riskPercentage}%
                                            </span>
                                        </div>
                                        <div className={styles.topIncident}>
                                            Top incident: {pred.topIncident} ({incidentPercentage}%)
                                        </div>
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
