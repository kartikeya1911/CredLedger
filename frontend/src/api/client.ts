import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1'

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      delete api.defaults.headers.common.Authorization
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  },
)

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    localStorage.setItem('accessToken', token)
  } else {
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem('accessToken')
  }
}
