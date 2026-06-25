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
      // Server replied with a non-2xx status code.
      console.error('[API] ← HTTP error', error.response.status, error.response.data)
    } else if (error.request) {
      // Request was made but the browser received no response.
      // This is almost always a CORS block: the server returns 200 but
      // the browser discards it because the response lacks the correct
      // Access-Control-Allow-Origin header.
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
