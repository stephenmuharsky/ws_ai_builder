import { useState, useEffect } from 'react'
import { fetchAdvisorsFromAirtable, isAirtableConfigured } from '../utils/airtable'
import { sampleAdvisors } from '../data/sampleLeads'

export function useAdvisors() {
  const [advisors, setAdvisors] = useState(sampleAdvisors)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAirtableConfigured()) {
      setLoading(false)
      return
    }

    let cancelled = false
    fetchAdvisorsFromAirtable()
      .then(data => {
        if (!cancelled) setAdvisors(data)
      })
      .catch(err => {
        console.warn('Failed to fetch advisors from Airtable, using sample data:', err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { advisors, loading }
}
