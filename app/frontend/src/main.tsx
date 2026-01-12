import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MapToronto from "./component/MapToronto.tsx";
import "./style/Weather.css";
import StatsPanel from "./component/StatsPanel.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapToronto />
      <StatsPanel
          selectedLineIds={new Set()}
          lineIds={[]}
          linesById={{}}
          stopsById={{}}
      />
  </StrictMode>,
)
