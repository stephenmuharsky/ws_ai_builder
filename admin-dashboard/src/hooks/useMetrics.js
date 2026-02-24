import { useState, useEffect, useCallback } from 'react'
import { fetchMetrics as apiFetchMetrics } from '../utils/api'
import { sampleLeads } from '../data/sampleLeads'

const fallbackMetrics = (() => {
  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const thisWeek = sampleLeads.filter(l => new Date(l.submittedAt) >= weekAgo)
  const booked = sampleLeads.filter(l => ['BOOKED', 'COMPLETED'].includes(l.status))
  const pending = sampleLeads.filter(l => l.status === 'PENDING_REVIEW')

  return {
    leadsThisWeek: thisWeek.length,
    totalLeads: sampleLeads.length,
    pendingReview: pending.length,
    bookedConsultations: booked.length,
    avgHoursToBook: 4,
  }
})()

export function useMetrics() {
  const [metrics, setMetrics] = useState(fallbackMetrics)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetchMetrics()
      setMetrics(data)
    } catch {
      setMetrics(fallbackMetrics)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { metrics, loading, refresh: load }
}
