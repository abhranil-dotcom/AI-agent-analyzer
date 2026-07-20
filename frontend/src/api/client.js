import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Log every outgoing request — confirms VITE_API_URL is baked in correctly.
apiClient.interceptors.request.use((config) => {
  console.log('[API] →', config.method?.toUpperCase(), config.baseURL + config.url)
  return config
})

// Log every response so the browser console shows the full picture.
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] ← OK', response.status, response.data)
    return response
  },
  (error) => {
    if (error.response) {
      console.error('[API] ← HTTP error', error.response.status, error.response.data)
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
