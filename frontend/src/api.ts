import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1',
  withCredentials: true,
})

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    localStorage.setItem('accessToken', token)
  } else {
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem('accessToken')
  }
}

export { api }
