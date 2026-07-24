import axios from 'axios'

export const AUTH_TOKEN_STORAGE_KEY = 'resume-analyzer-auth-token'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Attach the bearer token (if any) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Log every outgoing request — confirms VITE_API_URL is baked in correctly.
apiClient.interceptors.request.use((config) => {
  console.log('[API] →', config.method?.toUpperCase(), config.baseURL + config.url)
  return config
})

// Log every response so the browser console shows the full picture. A 401 means the stored
// token is missing/expired/invalid — notify AuthContext (via a window event, since this module
// isn't a component and can't use router/context hooks directly) so it can clear state and the
// app can redirect to /login.
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] ← OK', response.status, response.data)
    return response
  },
  (error) => {
    if (error.response) {
      console.error('[API] ← HTTP error', error.response.status, error.response.data)
      if (error.response.status === 401) {
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    } else if (error.request) {
      console.error(
        '[API] ← No response received — likely CORS block.',
        'Check: is CORS_ORIGINS set in the Render dashboard to include the Vercel URL?',
        error.message,
      )
    } else {
      console.error('[API] ← Request setup error:', error.message)
    }
    return Promise.reject(error)
  },
)

export async function signup(email, password) {
  const response = await apiClient.post('/api/auth/signup', { email, password })
  return response.data
}

export async function login(email, password) {
  const response = await apiClient.post('/api/auth/login', { email, password })
  return response.data
}

export async function fetchCurrentUser() {
  const response = await apiClient.get('/api/auth/me')
  return response.data
}

export async function forgotPassword(email) {
  const response = await apiClient.post('/api/auth/forgot-password', { email })
  return response.data
}

export async function resetPassword(token, newPassword) {
  const response = await apiClient.post('/api/auth/reset-password', { token, new_password: newPassword })
  return response.data
}

export async function uploadResume(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/api/resume/upload', formData)
  return response.data
}

export async function analyzeResume(extractedText, targetRole, resumeFilename = null) {
  const response = await apiClient.post('/api/resume/analyze', {
    extracted_text: extractedText,
    target_role: targetRole,
    resume_filename: resumeFilename,
  })
  return response.data
}

export async function clearCompanyRecommendationHistory() {
  await apiClient.delete('/api/companies/history')
}

export async function recommendCompanies(extractedText, targetRole, analysis) {
  const response = await apiClient.post('/api/companies/recommend', {
    extracted_text: extractedText,
    target_role: targetRole,
    analysis,
  })
  return response.data
}

export async function generateInterviewKit(companySlug, targetRole, extractedText, analysis) {
  const response = await apiClient.post('/api/interview/kit', {
    company_slug: companySlug,
    target_role: targetRole,
    extracted_text: extractedText,
    analysis,
  })
  return response.data
}

export async function evaluateAnswer(question, category, targetRole, companySlug, candidateAnswer) {
  const response = await apiClient.post('/api/interview/evaluate', {
    question,
    category,
    target_role: targetRole,
    company_slug: companySlug,
    candidate_answer: candidateAnswer,
  })
  return response.data
}

export async function matchResumeToJD(extractedText, targetRole, analysis, jobDescription) {
  const response = await apiClient.post('/api/toolkit/match-jd', {
    extracted_text: extractedText,
    target_role: targetRole,
    analysis,
    job_description: jobDescription,
  })
  return response.data
}

export async function clearJDMatchHistory() {
  await apiClient.delete('/api/toolkit/match-jd/history')
}

export async function rewriteResume(extractedText, targetRole, analysis) {
  const response = await apiClient.post('/api/toolkit/rewrite-resume', {
    extracted_text: extractedText,
    target_role: targetRole,
    analysis,
  })
  return response.data
}

export async function downloadOptimizedResumePdf(optimizedResume) {
  const response = await apiClient.post(
    '/api/toolkit/rewrite-resume/download',
    { optimized_resume: optimizedResume },
    { responseType: 'blob' },
  )

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'optimized_resume.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function recommendLearningResources(extractedText, targetRole, analysis, extraMissingSkills = []) {
  const response = await apiClient.post('/api/toolkit/learning-resources', {
    extracted_text: extractedText,
    target_role: targetRole,
    analysis,
    extra_missing_skills: extraMissingSkills,
  })
  return response.data
}

export async function analyzeSkillGap(extractedText, targetRole, analysis) {
  const response = await apiClient.post('/api/toolkit/skill-gap', {
    extracted_text: extractedText,
    target_role: targetRole,
    analysis,
  })
  return response.data
}

export async function generateCoverLetter(extractedText, targetRole, analysis, companyName) {
  const response = await apiClient.post('/api/toolkit/cover-letter', {
    extracted_text: extractedText,
    target_role: targetRole,
    analysis,
    company_name: companyName ?? null,
  })
  return response.data
}

export async function fetchDashboardSummary() {
  const response = await apiClient.get('/api/dashboard/summary')
  return response.data
}

export async function fetchResumeHistory() {
  const response = await apiClient.get('/api/resume/history')
  return response.data
}

export async function fetchResumeHistoryDetail(id) {
  const response = await apiClient.get(`/api/resume/history/${id}`)
  return response.data
}

export async function compareResumeHistory(idA, idB) {
  const response = await apiClient.get('/api/resume/history/compare', { params: { ids: `${idA},${idB}` } })
  return response.data
}

export async function deleteResumeHistory(id) {
  await apiClient.delete(`/api/resume/history/${id}`)
}

export async function clearResumeHistory() {
  await apiClient.delete('/api/resume/history')
}

export async function saveInterviewHistory(payload) {
  const response = await apiClient.post('/api/interview/history', payload)
  return response.data
}

export async function fetchInterviewHistory() {
  const response = await apiClient.get('/api/interview/history')
  return response.data
}

export async function fetchInterviewHistoryDetail(id) {
  const response = await apiClient.get(`/api/interview/history/${id}`)
  return response.data
}

export async function deleteInterviewHistory(id) {
  await apiClient.delete(`/api/interview/history/${id}`)
}

export async function clearInterviewHistory() {
  await apiClient.delete('/api/interview/history')
}
