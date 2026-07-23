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

export async function uploadResume(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/api/resume/upload', formData)
  return response.data
}

export async function analyzeResume(extractedText, targetRole) {
  const response = await apiClient.post('/api/resume/analyze', {
    extracted_text: extractedText,
    target_role: targetRole,
  })
  return response.data
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
