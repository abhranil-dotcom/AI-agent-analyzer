import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export async function uploadResume(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/api/resume/upload', formData)
  return response.data
}
