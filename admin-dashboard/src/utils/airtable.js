const PAT = import.meta.env.VITE_AIRTABLE_PAT || ''
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || ''
const LEADS_TABLE = import.meta.env.VITE_AIRTABLE_LEADS_TABLE || 'Leads'
const ADVISORS_TABLE = import.meta.env.VITE_AIRTABLE_ADVISORS_TABLE || 'Advisor Info'

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`

async function airtableRequest(tableName, params = {}) {
  const url = new URL(`${BASE_URL}/${encodeURIComponent(tableName)}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${PAT}` },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error?.message || `Airtable error: ${res.status}`)
  }

  return res.json()
}

// Airtable returns { records: [{ id, fields, createdTime }] }
// We flatten fields and attach the Airtable record id for updates.
function normalizeRecord(record) {
  const fields = record.fields || {}
  const lead = { _airtableId: record.id }

  // Direct string fields — copy as-is
  const directFields = [
    'leadId', 'fullName', 'email', 'phone', 'province',
    'investableAssets', 'annualIncome', 'investmentTimeline',
    'riskTolerance', 'currentAdvisorSituation',
    'preferredDate', 'preferredTime', 'backupDate', 'backupTime',
    'freeText', 'status', 'disqualificationReason',
    'priorityScore', 'profileSummary',
    'availabilityStatus', 'assignedAdvisorId', 'assignedAdvisorName',
    'bookedAt', 'appointmentDatetime', 'calendarEventId',
    'submittedAt', 'approvedAt', 'rejectedAt', 'rejectionReason',
    'followUpCount', 'lastEmailSentAt', 'overrideReason',
    'priorityReasoning',
    // WF10/WF11 fields
    'consultationPrepBrief',
    'nurtureEmailDraft', 'nurtureEmailSubject', 'nurtureEmailStatus',
  ]

  for (const key of directFields) {
    lead[key] = fields[key] ?? null
  }

  // financialGoals: Airtable Multiple Select returns an array.
  // The dashboard expects a comma-separated string.
  const goals = fields.financialGoals
  if (Array.isArray(goals)) {
    lead.financialGoals = goals.join(',')
  } else {
    lead.financialGoals = goals || ''
  }

  // JSON fields — Airtable stores these as Long Text.
  // They may already be strings (from n8n writing JSON.stringify output)
  // or they may be plain text. Pass through as-is — the dashboard's
  // safeJsonParse() handles both strings and objects gracefully.
  const jsonFields = [
    'recommendedServiceTier', 'advisorMatchRanking',
    'riskFlags', 'conversationStarters', 'suggestedBooking',
  ]
  for (const key of jsonFields) {
    lead[key] = fields[key] ?? null
  }

  return lead
}

function normalizeAdvisor(record) {
  const f = record.fields || {}
  return {
    _airtableId: record.id,
    advisorId: f.advisorId || '',
    advisorName: f.advisorName || '',
    email: f.email || '',
    specializations: typeof f.specializations === 'string'
      ? f.specializations.split(',').map(s => s.trim())
      : (f.specializations || []),
    currentCaseload: Number(f.currentCaseload) || 0,
    maxCapacity: Number(f.maxCapacity) || 0,
    caseloadPercent: f.maxCapacity
      ? Math.round((Number(f.currentCaseload) / Number(f.maxCapacity)) * 100)
      : 0,
    bio: f.bio || '',
  }
}

// ----- Public API -----

const STATUS_GROUPS = {
  pending: ['PENDING_REVIEW'],
  auto_rejected: ['DISQUALIFIED'],
  active: ['APPROVED', 'OUTREACH_IN_PROGRESS', 'BOOKED', 'UNRESPONSIVE', 'COMPLETED', 'REJECTED', 'CANCELLED_BY_LEAD'],
}

export async function fetchLeadsFromAirtable(tab = 'pending') {
  const statuses = STATUS_GROUPS[tab] || STATUS_GROUPS.pending
  const formula = statuses.length === 1
    ? `{status} = '${statuses[0]}'`
    : `OR(${statuses.map(s => `{status} = '${s}'`).join(',')})`

  // Airtable pagination — collect all pages
  let allRecords = []
  let offset = undefined

  do {
    const params = { filterByFormula: formula, pageSize: '100' }
    if (offset) params.offset = offset

    // Sort pending by priority then submission date
    if (tab === 'pending') {
      params['sort[0][field]'] = 'priorityScore'
      params['sort[0][direction]'] = 'asc'
      params['sort[1][field]'] = 'submittedAt'
      params['sort[1][direction]'] = 'asc'
    }

    const data = await airtableRequest(LEADS_TABLE, params)
    allRecords = allRecords.concat(data.records || [])
    offset = data.offset
  } while (offset)

  let leads = allRecords.map(normalizeRecord)

  // Airtable sort on priorityScore is alphabetical (HIGH < LOW < MEDIUM).
  // Re-sort client-side for correct priority ordering.
  if (tab === 'pending') {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    leads.sort((a, b) => {
      const pa = order[a.priorityScore] ?? 3
      const pb = order[b.priorityScore] ?? 3
      if (pa !== pb) return pa - pb
      return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0)
    })
  }

  return { leads, count: leads.length, tab }
}

export async function fetchMetricsFromAirtable() {
  // Fetch all leads (we need counts across statuses).
  // For large tables, consider a view or summary field instead.
  let allRecords = []
  let offset = undefined

  do {
    const params = {
      'fields[]': ['status', 'submittedAt', 'bookedAt'],
      pageSize: '100',
    }
    if (offset) params.offset = offset

    const data = await airtableRequest(LEADS_TABLE, params)
    allRecords = allRecords.concat(data.records || [])
    offset = data.offset
  } while (offset)

  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

  let totalLeads = allRecords.length
  let leadsThisWeek = 0
  let pendingReview = 0
  let bookedConsultations = 0
  let totalHoursToBook = 0
  let bookedWithTimestamps = 0

  for (const rec of allRecords) {
    const f = rec.fields || {}
    const submitted = f.submittedAt ? new Date(f.submittedAt) : null

    if (submitted && submitted >= weekAgo) leadsThisWeek++
    if (f.status === 'PENDING_REVIEW') pendingReview++
    if (f.status === 'BOOKED' || f.status === 'COMPLETED') {
      bookedConsultations++
      if (f.bookedAt && submitted) {
        const hours = (new Date(f.bookedAt) - submitted) / 3600000
        if (hours > 0) {
          totalHoursToBook += hours
          bookedWithTimestamps++
        }
      }
    }
  }

  return {
    leadsThisWeek,
    totalLeads,
    pendingReview,
    bookedConsultations,
    avgHoursToBook: bookedWithTimestamps > 0
      ? Math.round((totalHoursToBook / bookedWithTimestamps) * 10) / 10
      : 0,
  }
}

export async function fetchAdvisorsFromAirtable() {
  let allRecords = []
  let offset = undefined

  do {
    const params = { pageSize: '100' }
    if (offset) params.offset = offset

    const data = await airtableRequest(ADVISORS_TABLE, params)
    allRecords = allRecords.concat(data.records || [])
    offset = data.offset
  } while (offset)

  return allRecords.map(normalizeAdvisor)
}

export function isAirtableConfigured() {
  return Boolean(PAT && BASE_ID)
}
