const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5678/webhook'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchLeads(tab = 'pending') {
  return request(`/api/leads?tab=${tab}`)
}

export async function fetchMetrics() {
  return request('/api/metrics')
}

export async function approveLead(leadId, assignedAdvisorId, assignedAdvisorName) {
  return request('/api/leads/approve', {
    method: 'POST',
    body: JSON.stringify({ leadId, assignedAdvisorId, assignedAdvisorName }),
  })
}

export async function rejectLead(leadId, rejectionReason, customNote) {
  return request('/api/leads/reject', {
    method: 'POST',
    body: JSON.stringify({ leadId, rejectionReason, customNote }),
  })
}

export async function overrideLead(leadId, overrideReason) {
  return request('/api/leads/override', {
    method: 'POST',
    body: JSON.stringify({ leadId, overrideReason }),
  })
}

export async function requestInfo(leadId, followUpQuestion) {
  return request('/api/leads/request-info', {
    method: 'POST',
    body: JSON.stringify({ leadId, followUpQuestion }),
  })
}
