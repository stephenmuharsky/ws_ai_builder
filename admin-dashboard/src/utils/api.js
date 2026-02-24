import {
  fetchLeadsFromAirtable,
  fetchMetricsFromAirtable,
  isAirtableConfigured,
} from './airtable'

const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'

// ── Reads: Airtable direct (with n8n fallback) ─────────────────────

export async function fetchLeads(tab = 'pending') {
  if (isAirtableConfigured()) {
    return fetchLeadsFromAirtable(tab)
  }
  // Fallback to n8n WF4 if Airtable is not configured
  return n8nRequest(`/api/leads?tab=${tab}`)
}

export async function fetchMetrics() {
  if (isAirtableConfigured()) {
    return fetchMetricsFromAirtable()
  }
  return n8nRequest('/api/metrics')
}

// ── Writes: Always go through n8n (triggers downstream workflows) ──

export async function approveLead(leadId, assignedAdvisorId, assignedAdvisorName) {
  return n8nRequest('/api/leads/approve', {
    method: 'POST',
    body: JSON.stringify({ leadId, assignedAdvisorId, assignedAdvisorName }),
  })
}

export async function rejectLead(leadId, rejectionReason, customNote) {
  return n8nRequest('/api/leads/reject', {
    method: 'POST',
    body: JSON.stringify({ leadId, rejectionReason, customNote }),
  })
}

export async function overrideLead(leadId, overrideReason) {
  return n8nRequest('/api/leads/override', {
    method: 'POST',
    body: JSON.stringify({ leadId, overrideReason }),
  })
}

export async function requestInfo(leadId, followUpQuestion) {
  return n8nRequest('/api/leads/request-info', {
    method: 'POST',
    body: JSON.stringify({ leadId, followUpQuestion }),
  })
}

// ── n8n helper ──────────────────────────────────────────────────────

async function n8nRequest(path, options = {}) {
  const url = `${N8N_BASE_URL}${path}`
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
