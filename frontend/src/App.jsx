import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import UploadPage from './pages/UploadPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'

export default function App() {
  // Extraction result is lifted here so it survives navigation between
  // the upload and analysis pages without re-hitting the API.
  const [result, setResult] = useState(null)
  const location = useLocation()

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-[#080b14]">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-0 bg-glow" />

      <Header />

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div key={location.pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<UploadPage result={result} onExtracted={setResult} />} />
            <Route
              path="/analysis"
              element={result ? <AnalysisPage result={result} /> : <Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </main>
    </div>
  )
}
