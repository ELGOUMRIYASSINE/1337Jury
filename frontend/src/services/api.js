
import axios from 'axios'

// In production, use the backend URL directly. In dev, use proxy
const API_URL = import.meta.env.VITE_API_URL || 'https://1337jury-production.up.railway.app/api'

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


export const authApi = {
  getLoginUrl: () => `${API_URL}/auth/login`,
  getMe: (token) => api.get(`/auth/me?token=${token}`),
  verify: (token) => api.get(`/auth/verify?token=${token}`),
}

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
}

export const resourcesApi = {
  list: (projectId) => api.get('/resources', { params: { project_id: projectId } }),
  create: (data) => api.post('/resources', data),
  vote: (id, isUpvote) => api.post(`/resources/${id}/vote`, { is_upvote: isUpvote }),
  delete: (id) => api.delete(`/resources/${id}`),
}

export const votesApi = {
  list: (projectId, status) => api.get('/votes', { params: { project_id: projectId, status } }),
  get: (id) => api.get(`/votes/${id}`),
  create: (data) => api.post('/votes', data),
  update: (id, data) => api.put(`/votes/${id}`, data),
  delete: (id) => api.delete(`/votes/${id}`),
  cast: (id, optionId) => api.post(`/votes/${id}/cast`, { option_id: optionId }),
  staffDecision: (id, optionId, reason) => api.post(`/votes/${id}/staff-decision`, { winning_option_id: optionId, reason }),
  close: (id) => api.post(`/votes/${id}/close`),
}

export const disputesApi = {
  list: (projectId, status) => api.get('/disputes', { params: { project_id: projectId, status } }),
  get: (id) => api.get(`/disputes/${id}`),
  create: (data) => api.post('/disputes', data),
  update: (id, data) => api.put(`/disputes/${id}`, data),
  delete: (id) => api.delete(`/disputes/${id}`),
  vote: (id, voteFor) => api.post(`/disputes/${id}/vote`, { vote_for: voteFor }),
  staffDecision: (id, winner, reason) => api.post(`/disputes/${id}/staff-decision`, { winner, reason }),
  close: (id) => api.post(`/disputes/${id}/close`),
}

export const testsApi = {
  list: (projectId, approvedOnly = true) => api.get('/tests', { params: { project_id: projectId, approved_only: approvedOnly } }),
  pending: () => api.get('/tests/pending'),
  create: (data) => api.post('/tests', data),
  approve: (id) => api.post(`/tests/${id}/approve`),
  reject: (id) => api.post(`/tests/${id}/reject`),
  download: (id) => api.post(`/tests/${id}/download`),
  delete: (id) => api.delete(`/tests/${id}`),
}

export const commentsApi = {
  list: (voteId, disputeId) => api.get('/comments', { params: { vote_id: voteId, dispute_id: disputeId } }),
  create: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`),
  getCounts: (voteIds, disputeIds) => api.get('/comments/count', { 
    params: { vote_ids: voteIds?.join(','), dispute_ids: disputeIds?.join(',') } 
  }),
}

export const recodesApi = {
  list: (projectId, campus, status) => {
    const params = { _t: Date.now() }
    if (projectId) params.project_id = projectId
    if (campus) params.campus = campus
    if (status) params.status = status
    return api.get('/recodes', { params, headers: { 'Cache-Control': 'no-cache' } })
  },
  get: (id) => api.get(`/recodes/${id}`),
  myRequests: () => api.get('/recodes/my', { params: { _t: Date.now() }, headers: { 'Cache-Control': 'no-cache' } }),
  getCampuses: () => api.get('/recodes/campuses'),
  getPlatforms: () => api.get('/recodes/platforms'),
  create: (data) => api.post('/recodes', data),
  update: (id, data) => api.put(`/recodes/${id}`, data),
  accept: (id) => api.post(`/recodes/${id}/accept`),
  complete: (id) => api.post(`/recodes/${id}/complete`),
  cancel: (id) => api.post(`/recodes/${id}/cancel`),
  delete: (id) => api.delete(`/recodes/${id}`),
}

export default api