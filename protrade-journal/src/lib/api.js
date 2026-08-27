import { createClient } from '@supabase/supabase-js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

class ApiClient {
  constructor() {
    this.baseURL = API_URL
    this.token = null
  }

  setToken(token) {
    this.token = token
  }

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json' }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    const res = await fetch(`${this.baseURL}${endpoint}`, {
      headers,
      ...options
    })
    return res.json()
  }

  getTrades() { return this.request('/trades') }
  createTrade(data) { return this.request('/trades', { method: 'POST', body: JSON.stringify(data) }) }
  updateTrade(id, data) { return this.request(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  deleteTrade(id) { return this.request(`/trades/${id}`, { method: 'DELETE' }) }

  getNotes() { return this.request('/notes') }
  createNote(data) { return this.request('/notes', { method: 'POST', body: JSON.stringify(data) }) }
  updateNote(id, data) { return this.request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  deleteNote(id) { return this.request(`/notes/${id}`, { method: 'DELETE' }) }

  getTags() { return this.request('/tags') }
  createTag(data) { return this.request('/tags', { method: 'POST', body: JSON.stringify(data) }) }
  updateTag(id, data) { return this.request(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  deleteTag(id) { return this.request(`/tags/${id}`, { method: 'DELETE' }) }

  getSurveillances() { return this.request('/surveillances') }
  createSurveillance(data) { return this.request('/surveillances', { method: 'POST', body: JSON.stringify(data) }) }
  updateSurveillance(id, data) { return this.request(`/surveillances/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  deleteSurveillance(id) { return this.request(`/surveillances/${id}`, { method: 'DELETE' }) }

  getSurveillanceConfirmations(surveillanceId) { return this.request(`/surveillances/${surveillanceId}/confirmations`) }
  createSurveillanceConfirmation(surveillanceId, data) { return this.request(`/surveillances/${surveillanceId}/confirmations`, { method: 'POST', body: JSON.stringify(data) }) }
  updateSurveillanceConfirmation(surveillanceId, confirmationId, data) { return this.request(`/surveillances/${surveillanceId}/confirmations/${confirmationId}`, { method: 'PUT', body: JSON.stringify(data) }) }
  deleteSurveillanceConfirmation(surveillanceId, confirmationId) { return this.request(`/surveillances/${surveillanceId}/confirmations/${confirmationId}`, { method: 'DELETE' }) }

  getSurveillanceScreenshots(surveillanceId) { return this.request(`/surveillances/${surveillanceId}/screenshots`) }
  createSurveillanceScreenshot(surveillanceId, data) { return this.request(`/surveillances/${surveillanceId}/screenshots`, { method: 'POST', body: JSON.stringify(data) }) }
  deleteSurveillanceScreenshot(surveillanceId, screenshotId) { return this.request(`/surveillances/${surveillanceId}/screenshots/${screenshotId}`, { method: 'DELETE' }) }

  getSettings() { return this.request('/settings') }
  updateSettings(data) { return this.request('/settings', { method: 'PUT', body: JSON.stringify(data) }) }
}

export const api = new ApiClient()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
