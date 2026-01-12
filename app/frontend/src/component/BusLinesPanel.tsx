import React from "react";

type Props = {
    lineIds: String[];
    selected: Set<String>;
    onToggle: (id: string) => void;
};

export default function BusLinesPanel({ lineIds, selected, onToggle }: Props) {
    const [query, setQuery] = React.useState("");

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return lineIds;
        return lineIds.filter((l) => l.toString().toLowerCase().includes(q));
    }, [lineIds, query]);

    return (
        <aside
            style={{
                position: "fixed",
                top: 16,
                right: 16,
                width: 340,
                maxHeight: "calc(100vh - 32px)",
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                backdropFilter: "blur(10px)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                zIndex: 10,
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 650, letterSpacing: 0.2 }}>Lignes de bus</div>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>{selected.size} sélectionnée(s)</div>
                </div>
            </div>

            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une ligne…"
                style={{
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 13,
                    outline: "none",
                }}
            />

            <div
                style={{
                    overflow: "auto",
                    paddingRight: 4,
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 8,
                }}
            >
                {filtered.map((id) => {
                    const checked = selected.has(id);
                    return (
                        <label
                            key={id.toString()}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                border: "1px solid rgba(0,0,0,0.08)",
                                borderRadius: 12,
                                padding: "8px 10px",
                                cursor: "pointer",
                                background: checked ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.6)",
                                userSelect: "none",
                            }}
                        >
                            <input type="checkbox" checked={checked} onChange={() => onToggle(id.toString())} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{id}</span>
                        </label>
                    );
                })}
            </div>
        </aside>
    );
}
