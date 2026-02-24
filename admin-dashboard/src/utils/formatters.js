export function formatAssets(value) {
  const map = {
    under_25k: 'Under $25K',
    '25k_100k': '$25K - $100K',
    '100k_250k': '$100K - $250K',
    '250k_500k': '$250K - $500K',
    '500k_1m': '$500K - $1M',
    '1m_plus': '$1M+',
  }
  return map[value] || value
}

export function formatIncome(value) {
  const map = {
    under_50k: 'Under $50K',
    '50k_100k': '$50K - $100K',
    '100k_200k': '$100K - $200K',
    '200k_500k': '$200K - $500K',
    '500k_plus': '$500K+',
  }
  return map[value] || value
}

export function formatTimeline(value) {
  const map = {
    under_1yr: '<1 year',
    '1_3yr': '1-3 years',
    '3_5yr': '3-5 years',
    '5_10yr': '5-10 years',
    '10_plus': '10+ years',
  }
  return map[value] || value
}

export function formatProvince(code) {
  const map = {
    ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta', QC: 'Quebec',
    MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
    NL: 'Newfoundland', PE: 'PEI', NT: 'Northwest Territories', YT: 'Yukon', NU: 'Nunavut',
  }
  return map[code] || code
}

export function formatRisk(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatAdvisorSituation(value) {
  const map = {
    switching: 'Switching advisors',
    never_had: 'First-time client',
    previously_had: 'Previously had advisor',
  }
  return map[value] || value
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
}

export function formatTime(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function parseGoals(goals) {
  if (Array.isArray(goals)) return goals
  if (typeof goals === 'string') return goals.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

export function safeJsonParse(str, fallback) {
  if (!str) return fallback
  if (typeof str === 'object') return str
  try { return JSON.parse(str) } catch { return fallback }
}

export function getDisqualificationLabel(reason) {
  const map = {
    jurisdiction_not_served: 'Jurisdiction not served',
    below_asset_threshold: 'Below asset threshold',
    goal_mismatch: 'Service goals not offered',
  }
  if (!reason) return 'Unknown reason'
  return reason.split(',').map(r => map[r.trim()] || r.trim()).join(', ')
}
