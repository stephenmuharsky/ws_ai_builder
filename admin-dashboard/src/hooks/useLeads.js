import { useState, useEffect, useCallback } from 'react'
import { fetchLeads as apiFetchLeads } from '../utils/api'
import { sampleLeads } from '../data/sampleLeads'

export function useLeads(tab = 'pending') {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const statusMap = {
    pending: ['PENDING_REVIEW'],
    auto_rejected: ['DISQUALIFIED'],
    active: ['APPROVED', 'OUTREACH_IN_PROGRESS', 'BOOKED', 'UNRESPONSIVE', 'COMPLETED', 'REJECTED', 'CANCELLED_BY_LEAD'],
  }

  const getFallbackLeads = useCallback((tabName) => {
    const validStatuses = statusMap[tabName] || statusMap.pending
    let filtered = sampleLeads.filter(l => validStatuses.includes(l.status))

    if (tabName === 'pending') {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      filtered.sort((a, b) => {
        const pa = order[a.priorityScore] ?? 3
        const pb = order[b.priorityScore] ?? 3
        if (pa !== pb) return pa - pb
        return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0)
      })
    }
    return filtered
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetchLeads(tab)
      setLeads(data.leads || [])
      setUsingFallback(false)
    } catch {
      setLeads(getFallbackLeads(tab))
      setUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }, [tab, getFallbackLeads])

  useEffect(() => {
    load()
  }, [load])

  const removeLead = useCallback((leadId) => {
    setLeads(prev => prev.filter(l => l.leadId !== leadId))
  }, [])

  return { leads, loading, error, usingFallback, refresh: load, removeLead }
}
