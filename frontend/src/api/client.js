import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

export async function uploadResume(file) {
  const formData = new FormData()
  formData.append('file', file)

  // Do NOT set Content-Type manually — Axios sets multipart/form-data with the
  // correct boundary automatically when the body is a FormData instance.
  const response = await apiClient.post('/api/resume/upload', formData)

  return response.data
}
