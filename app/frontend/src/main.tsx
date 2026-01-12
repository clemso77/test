import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MapToronto from "./component/MapToronto.tsx";
import "./style/Weather.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapToronto />
  </StrictMode>,
)
