import React from "react";
import styles from "./BusLinesPanel.module.css";

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
        <aside className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.headerTitle}>Lignes de bus</div>
                    <div className={styles.selectedCount}>{selected.size} sélectionnée(s)</div>
                </div>
            </div>

            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une ligne…"
                className={styles.searchInput}
            />

            <div className={styles.linesGrid}>
                {filtered.map((id) => {
                    const checked = selected.has(id);
                    return (
                        <label
                            key={id.toString()}
                            className={`${styles.lineLabel} ${checked ? styles.checked : ''}`}
                        >
                            <input type="checkbox" checked={checked} onChange={() => onToggle(id.toString())} />
                            <span className={styles.lineName}>{id}</span>
                        </label>
                    );
                })}
            </div>
        </aside>
    );
}
