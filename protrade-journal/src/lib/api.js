import { createClient } from '@supabase/supabase-js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

let backendAvailable = true
let backendCheckTimer = null

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
    
    if (!this.token && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          this.token = session.access_token
        }
      } catch {
        // session check failed, will proceed without token
      }
    }
    
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

    if (!backendAvailable) {
      const res = await fetch(`${this.baseURL}/health`, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (res.ok) {
        backendAvailable = true
      }
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
        return (data || []).map(item => this.mapFromSupabase(table, item))
      }

      if (method === 'GET' && id && subResource) {
        const { data, error } = await supabase.from(subResource).select('*').eq(subResource === 'confirmations' ? 'surveillance_id' : 'surveillance_id', id)
        if (error) return { error: error.message }
        return (data || []).map(item => this.mapFromSupabase(subResource, item))
      }

      if (method === 'GET' && id) {
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
        if (error) return { error: error.message }
        return this.mapFromSupabase(table, data)
      }

      if (method === 'POST' && !id) {
        const body = options.body ? JSON.parse(options.body) : {}
        const mapped = this.mapToSupabase(table, body)
        const { data, error } = await supabase.from(table).insert(mapped).select().single()
        if (error) return { error: error.message }
        return this.mapFromSupabase(table, data)
      }

      if (method === 'PUT' && id && !subResource) {
        const body = options.body ? JSON.parse(options.body) : {}
        const mapped = this.mapToSupabase(table, body)
        const { data, error } = await supabase.from(table).update(mapped).eq('id', id).select().single()
        if (error) return { error: error.message }
        return this.mapFromSupabase(table, data)
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

  mapToSupabase(table, body) {
    if (table === 'trades') {
      const mapped = { ...body }
      if (mapped.tradeType) {
        mapped.direction = mapped.tradeType.toLowerCase()
        delete mapped.tradeType
      }
      if (mapped.tradingType) {
        mapped.style = mapped.tradingType
        delete mapped.tradingType
      }
      if (mapped.lotSize !== undefined) {
        mapped.lot_size = mapped.lotSize
        delete mapped.lotSize
      }
      if (mapped.stopLoss !== undefined) {
        mapped.stop_loss = mapped.stopLoss
        delete mapped.stopLoss
      }
      if (mapped.takeProfit !== undefined) {
        mapped.take_profit = mapped.takeProfit
        delete mapped.takeProfit
      }
      if (mapped.screenshot) {
        mapped.screenshot_url = mapped.screenshot
        delete mapped.screenshot
      }
      if (mapped.result === '' || mapped.result === null || mapped.result === undefined) {
        mapped.result = 0
      }
      if (mapped.date) {
        mapped.date = new Date(mapped.date).toISOString()
      }
      return mapped
    }
    if (table === 'notes') {
      return body
    }
    if (table === 'tags') {
      return body
    }
    if (table === 'surveillances') {
      const mapped = { ...body }
      if (mapped.direction) {
        mapped.direction = mapped.direction.toLowerCase()
      }
      if (mapped.date) {
        mapped.date = new Date(mapped.date).toISOString()
      }
      return mapped
    }
    if (table === 'settings') {
      const mapped = {}
      if (body.initialCapital !== undefined) mapped.initial_capital = body.initialCapital
      if (body.theme !== undefined) mapped.theme = body.theme
      if (body.defaultRisk !== undefined) mapped.default_risk = body.defaultRisk
      if (body.device !== undefined) mapped.device = body.device
      if (body.currency !== undefined) mapped.currency = body.currency
      if (body.language !== undefined) mapped.language = body.language
      return mapped
    }
    return body
  }

  mapFromSupabase(table, item) {
    if (!item || typeof item !== 'object') return item
    if (table === 'trades') {
      const mapped = { ...item }
      if ('direction' in mapped) { mapped.tradeType = mapped.direction.charAt(0).toUpperCase() + mapped.direction.slice(1); delete mapped.direction }
      if ('style' in mapped) { mapped.tradingType = mapped.style; delete mapped.style }
      if ('lot_size' in mapped) { mapped.lotSize = mapped.lot_size; delete mapped.lot_size }
      if ('stop_loss' in mapped) { mapped.stopLoss = mapped.stop_loss; delete mapped.stop_loss }
      if ('take_profit' in mapped) { mapped.takeProfit = mapped.take_profit; delete mapped.take_profit }
      if ('screenshot_url' in mapped) { mapped.screenshot = mapped.screenshot_url; delete mapped.screenshot_url }
      return mapped
    }
    if (table === 'settings') {
      const mapped = { ...item }
      if ('initial_capital' in mapped) { mapped.initialCapital = mapped.initial_capital; delete mapped.initial_capital }
      if ('default_risk' in mapped) { mapped.defaultRisk = mapped.default_risk; delete mapped.default_risk }
      return mapped
    }
    return item
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
