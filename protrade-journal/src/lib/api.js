import { createClient } from '@supabase/supabase-js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

let backendAvailable = true

async function checkBackend() {
  try {
    const res = await fetch(`${API_URL}/health`, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    backendAvailable = res.ok
  } catch {
    backendAvailable = false
  }
}

checkBackend()
setInterval(checkBackend, 30000)

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

    if (backendAvailable) {
      try {
        const res = await fetch(`${this.baseURL}${endpoint}`, {
          headers,
          ...options
        })
        if (res.ok) {
          return await res.json()
        }
        if (res.status === 404 || res.status === 400 || res.status === 500) {
          backendAvailable = false
        }
      } catch {
        backendAvailable = false
      }
    }

    return this.supabaseFallback(endpoint, options)
  }

  async supabaseFallback(endpoint, options) {
    if (!supabase) return { error: 'Supabase not configured' }

    const method = (options.method || 'GET').toUpperCase()
    let table = 'trades'
    let id = null
    let subResource = null
    let subResourceId = null

    const parts = endpoint.split('/').filter(Boolean)
    if (parts[0] === 'trades') { table = 'trades'; id = parts[1]; subResource = parts[2]; subResourceId = parts[3] }
    else if (parts[0] === 'notes') { table = 'notes'; id = parts[1] }
    else if (parts[0] === 'tags') { table = 'tags'; id = parts[1] }
    else if (parts[0] === 'surveillances') { table = 'surveillances'; id = parts[1]; subResource = parts[2]; subResourceId = parts[3] }
    else if (parts[0] === 'settings') { table = 'settings'; id = parts[1] }

    try {
      if (method === 'GET' && !id && !subResource) {
        const { data, error } = await supabase.from(table).select('*')
        if (error) return { error: error.message }
        return data || []
      }

      if (method === 'GET' && id && subResource) {
        const { data, error } = await supabase.from(subResource).select('*').eq(subResource === 'confirmations' ? 'surveillance_id' : 'surveillance_id', id)
        if (error) return { error: error.message }
        return data || []
      }

      if (method === 'GET' && id) {
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
        if (error) return { error: error.message }
        return data
      }

      if (method === 'POST' && !id) {
        const body = options.body ? JSON.parse(options.body) : {}
        const { data, error } = await supabase.from(table).insert(body).select().single()
        if (error) return { error: error.message }
        return data
      }

      if (method === 'PUT' && id && !subResource) {
        const body = options.body ? JSON.parse(options.body) : {}
        const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single()
        if (error) return { error: error.message }
        return data
      }

      if (method === 'DELETE' && id && !subResource) {
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) return { error: error.message }
        return { success: true }
      }

      if (method === 'POST' && id && subResource) {
        const body = options.body ? JSON.parse(options.body) : {}
        const { data, error } = await supabase.from(subResource).insert({ ...body, [subResource === 'confirmations' ? 'surveillance_id' : 'surveillance_id']: id }).select().single()
        if (error) return { error: error.message }
        return data
      }

      if (method === 'PUT' && id && subResource && subResourceId) {
        const body = options.body ? JSON.parse(options.body) : {}
        const { data, error } = await supabase.from(subResource).update(body).eq('id', subResourceId).eq('surveillance_id', id).select().single()
        if (error) return { error: error.message }
        return data
      }

      if (method === 'DELETE' && id && subResource && subResourceId) {
        const { error } = await supabase.from(subResource).delete().eq('id', subResourceId).eq('surveillance_id', id)
        if (error) return { error: error.message }
        return { success: true }
      }

      return { error: 'Unsupported operation' }
    } catch (e) {
      return { error: e.message }
    }
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
