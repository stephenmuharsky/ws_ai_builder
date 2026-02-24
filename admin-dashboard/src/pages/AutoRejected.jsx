import { useState } from 'react'
import { useLeads } from '../hooks/useLeads'
import LeadCard from '../components/LeadCard'
import { overrideLead } from '../utils/api'

export default function AutoRejected() {
  const { leads, loading, usingFallback, refresh, removeLead } = useLeads('auto_rejected')
  const [actionLoading, setActionLoading] = useState(false)

  const handleOverride = async (lead) => {
    setActionLoading(true)
    try {
      await overrideLead(lead.leadId, 'Admin override - moved to pending review')
      removeLead(lead.leadId)
    } catch {
      removeLead(lead.leadId)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-8 h-8 animate-spin text-navy-300" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-navy-700">Auto-Rejected</h2>
          <p className="text-sm text-navy-400 mt-0.5">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} disqualified by rules engine
            {usingFallback && (
              <span className="ml-2 text-amber-500 text-xs font-medium">(demo data)</span>
            )}
          </p>
        </div>
        <button onClick={refresh} className="btn-secondary-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Review these carefully.</span> Auto-rejection rules are deterministic and may miss context.
          For example, a lead below the asset threshold may mention a pending inheritance in their notes.
          Use the "Override" button to move any lead back to Pending Review.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-navy-400 text-lg font-medium">No auto-rejected leads</p>
          <p className="text-navy-300 text-sm mt-1">All incoming leads have passed the disqualification rules.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <LeadCard
              key={lead.leadId}
              lead={lead}
              variant="rejected"
              onOverride={handleOverride}
            />
          ))}
        </div>
      )}
    </div>
  )
}
