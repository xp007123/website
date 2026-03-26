import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import WhitepaperTechnical from './WhitepaperTechnical.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/whitepaper-technical" element={<WhitepaperTechnical />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
