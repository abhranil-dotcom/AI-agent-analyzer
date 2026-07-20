import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import UploadPage from './pages/UploadPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import CompaniesPage from './pages/CompaniesPage.jsx'
import InterviewPrepPage from './pages/InterviewPrepPage.jsx'
import MockInterviewPage from './pages/MockInterviewPage.jsx'
import ToolkitHubPage from './pages/ToolkitHubPage.jsx'
import JDMatchPage from './pages/JDMatchPage.jsx'
import ResumeRewritePage from './pages/ResumeRewritePage.jsx'
import SkillGapPage from './pages/SkillGapPage.jsx'
import CoverLetterPage from './pages/CoverLetterPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  // All pipeline state is lifted here so it survives navigation between pages
  // without re-hitting the API. Each stage's result feeds the next.
  const [result, setResult] = useState(null)
  const [targetRole, setTargetRole] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [interviewKit, setInterviewKit] = useState(null)
  const location = useLocation()

  // A fresh upload invalidates every downstream stage's cached result.
  function handleExtracted(newResult) {
    setResult(newResult)
    setAnalysis(null)
    setRecommendations(null)
    setSelectedCompany(null)
    setInterviewKit(null)
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-[#080b14]">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-0 bg-glow" />

      <Header />

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div key={location.pathname} className="page-transition">
          <Routes>
            <Route
              path="/"
              element={
                <UploadPage
                  result={result}
                  onExtracted={handleExtracted}
                  targetRole={targetRole}
                  onTargetRoleChange={setTargetRole}
                />
              }
            />
            <Route
              path="/analysis"
              element={
                result && targetRole.trim() ? (
                  <AnalysisPage
                    result={result}
                    targetRole={targetRole}
                    analysis={analysis}
                    onAnalysisComplete={setAnalysis}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/companies"
              element={
                analysis ? (
                  <CompaniesPage
                    result={result}
                    targetRole={targetRole}
                    analysis={analysis}
                    recommendations={recommendations}
                    onRecommendationsComplete={setRecommendations}
                    onSelectCompany={setSelectedCompany}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/interview-prep"
              element={
                analysis && selectedCompany ? (
                  <InterviewPrepPage
                    result={result}
                    targetRole={targetRole}
                    analysis={analysis}
                    company={selectedCompany}
                    interviewKit={interviewKit}
                    onKitComplete={setInterviewKit}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/mock-interview"
              element={
                interviewKit && selectedCompany ? (
                  <MockInterviewPage interviewKit={interviewKit} targetRole={targetRole} company={selectedCompany} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/toolkit"
              element={
                analysis ? (
                  <ToolkitHubPage targetRole={targetRole} selectedCompany={selectedCompany} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/toolkit/match-jd"
              element={
                analysis ? (
                  <JDMatchPage result={result} targetRole={targetRole} analysis={analysis} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/toolkit/rewrite"
              element={
                analysis ? (
                  <ResumeRewritePage result={result} targetRole={targetRole} analysis={analysis} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/toolkit/skill-gap"
              element={
                analysis ? (
                  <SkillGapPage result={result} targetRole={targetRole} analysis={analysis} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/toolkit/cover-letter"
              element={
                analysis ? (
                  <CoverLetterPage
                    result={result}
                    targetRole={targetRole}
                    analysis={analysis}
                    selectedCompany={selectedCompany}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
