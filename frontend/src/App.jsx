import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import EmptyState from './components/EmptyState.jsx'
import Header from './components/Header.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import CompaniesPage from './pages/CompaniesPage.jsx'
import InterviewPrepPage from './pages/InterviewPrepPage.jsx'
import MockInterviewPage from './pages/MockInterviewPage.jsx'
import ToolkitHubPage from './pages/ToolkitHubPage.jsx'
import ToolkitEntryPage from './pages/ToolkitEntryPage.jsx'
import JDMatchPage from './pages/JDMatchPage.jsx'
import ResumeRewritePage from './pages/ResumeRewritePage.jsx'
import SkillGapPage from './pages/SkillGapPage.jsx'
import CoverLetterPage from './pages/CoverLetterPage.jsx'
import LearningResourcesPage from './pages/LearningResourcesPage.jsx'
import ResumeHistoryPage from './pages/ResumeHistoryPage.jsx'
import ResumeHistoryDetailPage from './pages/ResumeHistoryDetailPage.jsx'
import ResumeComparePage from './pages/ResumeComparePage.jsx'
import InterviewHistoryPage from './pages/InterviewHistoryPage.jsx'
import InterviewHistoryDetailPage from './pages/InterviewHistoryDetailPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// The 5 individual toolkit tools need the raw extracted resume text (`result`), not just the
// saved `analysis` scores/summary — that raw text is never persisted to Resume History (only the
// analysis output is), so it's only available in-memory after a fresh upload+analyze in this
// session. When Career Toolkit was reached via the navbar's ToolkitEntryPage (loading a past
// analysis instead), `analysis` exists but `result` doesn't — shown here instead of crashing on
// `result.extracted_text` inside a tool page.
function MissingResumeTextNotice() {
  return (
    <EmptyState
      icon={Wrench}
      title="Resume text unavailable"
      description="This tool needs your original resume text, which isn't saved with your past analyses. Please upload and analyze your resume again to use it."
      ctaLabel="Upload Your Resume"
      ctaTo="/upload"
    />
  )
}

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
    <ToastProvider>
    <AuthProvider>
      <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-[#080b14]">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="pointer-events-none absolute inset-0 bg-glow" />

        <Header />

        <main className="relative mx-auto w-full max-w-5xl flex-1 px-6 py-12">
          <div key={location.pathname} className="page-transition">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <UploadPage
                      result={result}
                      onExtracted={handleExtracted}
                      targetRole={targetRole}
                      onTargetRoleChange={setTargetRole}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis"
                element={
                  <ProtectedRoute>
                    {result && targetRole.trim() ? (
                      <AnalysisPage
                        result={result}
                        targetRole={targetRole}
                        analysis={analysis}
                        onAnalysisComplete={setAnalysis}
                      />
                    ) : (
                      <Navigate to="/upload" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <ProtectedRoute>
                    {analysis ? (
                      <CompaniesPage
                        result={result}
                        targetRole={targetRole}
                        analysis={analysis}
                        recommendations={recommendations}
                        onRecommendationsComplete={setRecommendations}
                        onSelectCompany={setSelectedCompany}
                      />
                    ) : (
                      <Navigate to="/upload" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview-prep"
                element={
                  <ProtectedRoute>
                    {analysis && selectedCompany ? (
                      <InterviewPrepPage
                        result={result}
                        targetRole={targetRole}
                        analysis={analysis}
                        company={selectedCompany}
                        interviewKit={interviewKit}
                        onKitComplete={setInterviewKit}
                      />
                    ) : (
                      <Navigate to="/upload" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mock-interview"
                element={
                  <ProtectedRoute>
                    {interviewKit && selectedCompany ? (
                      <MockInterviewPage interviewKit={interviewKit} targetRole={targetRole} company={selectedCompany} />
                    ) : (
                      <Navigate to="/upload" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/toolkit"
                element={
                  <ProtectedRoute>
                    {analysis ? (
                      <ToolkitHubPage targetRole={targetRole} selectedCompany={selectedCompany} />
                    ) : (
                      <ToolkitEntryPage
                        targetRole={targetRole}
                        selectedCompany={selectedCompany}
                        onAnalysisComplete={setAnalysis}
                        onTargetRoleChange={setTargetRole}
                      />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/toolkit/match-jd"
                element={
                  <ProtectedRoute>
                    {!analysis ? (
                      <Navigate to="/upload" replace />
                    ) : !result ? (
                      <MissingResumeTextNotice />
                    ) : (
                      <JDMatchPage result={result} targetRole={targetRole} analysis={analysis} />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/toolkit/rewrite"
                element={
                  <ProtectedRoute>
                    {!analysis ? (
                      <Navigate to="/upload" replace />
                    ) : !result ? (
                      <MissingResumeTextNotice />
                    ) : (
                      <ResumeRewritePage result={result} targetRole={targetRole} analysis={analysis} />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/toolkit/skill-gap"
                element={
                  <ProtectedRoute>
                    {!analysis ? (
                      <Navigate to="/upload" replace />
                    ) : !result ? (
                      <MissingResumeTextNotice />
                    ) : (
                      <SkillGapPage result={result} targetRole={targetRole} analysis={analysis} />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/toolkit/learning-resources"
                element={
                  <ProtectedRoute>
                    {!analysis ? (
                      <Navigate to="/upload" replace />
                    ) : !result ? (
                      <MissingResumeTextNotice />
                    ) : (
                      <LearningResourcesPage result={result} targetRole={targetRole} analysis={analysis} />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/toolkit/cover-letter"
                element={
                  <ProtectedRoute>
                    {!analysis ? (
                      <Navigate to="/upload" replace />
                    ) : !result ? (
                      <MissingResumeTextNotice />
                    ) : (
                      <CoverLetterPage
                        result={result}
                        targetRole={targetRole}
                        analysis={analysis}
                        selectedCompany={selectedCompany}
                      />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-history"
                element={
                  <ProtectedRoute>
                    <ResumeHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-history/compare"
                element={
                  <ProtectedRoute>
                    <ResumeComparePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-history/:id"
                element={
                  <ProtectedRoute>
                    <ResumeHistoryDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview-history"
                element={
                  <ProtectedRoute>
                    <InterviewHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview-history/:id"
                element={
                  <ProtectedRoute>
                    <InterviewHistoryDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </AuthProvider>
    </ToastProvider>
  )
}
