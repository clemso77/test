import React from "react";
import type { Ligne, Arret } from "../../../backend/src/Model/Model.ts";

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

export default function StatsPanel({ selectedLineIds, lineIds, linesById, stopsById }: Props) {
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

    const containerStyle: React.CSSProperties = isMobile
        ? {
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              width: "100%",
              maxHeight: "60vh",
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "16px 16px 0 0",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
              backdropFilter: "blur(10px)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              zIndex: 10,
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
              overflow: "hidden",
          }
        : {
              position: "fixed",
              top: 16,
              left: 16,
              width: 380,
              maxHeight: "calc(100vh - 32px)",
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              backdropFilter: "blur(10px)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              zIndex: 10,
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
              overflow: "hidden",
          };

    return (
        <aside style={containerStyle} aria-label="Panneau de statistiques">
            {/* Header */}
            <div style={{ borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 650, margin: 0, letterSpacing: 0.2 }}>
                    📊 Statistiques
                </h2>
            </div>

            {/* Scrollable content */}
            <div style={{ overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Global Visualization Section */}
                <section aria-labelledby="global-viz-title">
                    <h3
                        id="global-viz-title"
                        style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px 0", opacity: 0.8 }}
                    >
                        Visualisation globale
                    </h3>
                    
                    {/* KPI Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div
                            style={{
                                background: "rgba(59, 130, 246, 0.1)",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                                borderRadius: 10,
                                padding: 10,
                            }}
                        >
                            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Bus visibles</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "rgb(59, 130, 246)" }}>
                                {/* Placeholder - could be calculated from real-time data */}
                                -
                            </div>
                        </div>
                        
                        <div
                            style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                borderRadius: 10,
                                padding: 10,
                            }}
                        >
                            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Lignes sélectionnées</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "rgb(16, 185, 129)" }}>
                                {selectedLinesCount}
                            </div>
                        </div>
                        
                        <div
                            style={{
                                background: "rgba(251, 146, 60, 0.1)",
                                border: "1px solid rgba(251, 146, 60, 0.2)",
                                borderRadius: 10,
                                padding: 10,
                                gridColumn: "1 / -1",
                            }}
                        >
                            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Arrêts affichés</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "rgb(251, 146, 60)" }}>
                                {displayedStopsCount}
                            </div>
                        </div>
                    </div>

                    {/* Simple Bar Chart */}
                    <div
                        style={{
                            background: "rgba(0,0,0,0.02)",
                            border: "1px solid rgba(0,0,0,0.06)",
                            borderRadius: 10,
                            padding: 12,
                        }}
                    >
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, opacity: 0.7 }}>
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
                        style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px 0", opacity: 0.8 }}
                    >
                        Prédiction par type d'incidents
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {incidentPredictions.map((pred) => {
                            const percentage = Math.round(pred.probability * 100);
                            const colorMap: Record<IncidentType, string> = {
                                Safety: "rgb(239, 68, 68)",
                                Operational: "rgb(251, 146, 60)",
                                Technical: "rgb(59, 130, 246)",
                                External: "rgb(168, 85, 247)",
                                Other: "rgb(107, 114, 128)",
                            };
                            const color = colorMap[pred.type];
                            
                            return (
                                <div key={pred.type}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: 4,
                                            fontSize: 12,
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{pred.type}</span>
                                        <span style={{ fontWeight: 700, color }}>{percentage}%</span>
                                    </div>
                                    <div
                                        style={{
                                            height: 8,
                                            background: "rgba(0,0,0,0.08)",
                                            borderRadius: 4,
                                            overflow: "hidden",
                                        }}
                                        role="progressbar"
                                        aria-valuenow={percentage}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${pred.type} incident probability: ${percentage}%`}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                width: `${percentage}%`,
                                                background: color,
                                                transition: "width 0.3s ease",
                                            }}
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
                        style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px 0", opacity: 0.8 }}
                    >
                        Prédictions par ligne
                    </h3>
                    
                    {selectedLineIds.size === 0 ? (
                        <div
                            style={{
                                padding: 16,
                                background: "rgba(0,0,0,0.02)",
                                border: "1px solid rgba(0,0,0,0.06)",
                                borderRadius: 10,
                                fontSize: 13,
                                color: "rgba(0,0,0,0.6)",
                                textAlign: "center",
                            }}
                        >
                            Sélectionnez une ligne pour voir les prédictions
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {linePredictions.map((pred) => {
                                const riskPercentage = Math.round(pred.riskScore * 100);
                                const incidentPercentage = Math.round(pred.topIncidentProbability * 100);
                                
                                const getRiskColor = (score: number) => {
                                    if (score >= 0.6) return "rgb(239, 68, 68)";
                                    if (score >= 0.4) return "rgb(251, 146, 60)";
                                    return "rgb(16, 185, 129)";
                                };
                                
                                return (
                                    <div
                                        key={pred.lineId}
                                        style={{
                                            background: "rgba(255,255,255,0.6)",
                                            border: "1px solid rgba(0,0,0,0.08)",
                                            borderRadius: 10,
                                            padding: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: 6,
                                            }}
                                        >
                                            <span style={{ fontSize: 13, fontWeight: 700 }}>Ligne {pred.lineId}</span>
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    color: getRiskColor(pred.riskScore),
                                                }}
                                            >
                                                {riskPercentage}%
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                opacity: 0.7,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Top incident: {pred.topIncident} ({incidentPercentage}%)
                                        </div>
                                        <div
                                            style={{
                                                height: 6,
                                                background: "rgba(0,0,0,0.08)",
                                                borderRadius: 3,
                                                overflow: "hidden",
                                            }}
                                            role="progressbar"
                                            aria-valuenow={riskPercentage}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`Risk score for line ${pred.lineId}: ${riskPercentage}%`}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${riskPercentage}%`,
                                                    background: getRiskColor(pred.riskScore),
                                                }}
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
