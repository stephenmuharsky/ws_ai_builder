import { useState } from 'react'
import { useLeads } from '../hooks/useLeads'
import LeadCard from '../components/LeadCard'
import ApproveModal from '../components/ApproveModal'
import RejectModal from '../components/RejectModal'
import RequestInfoModal from '../components/RequestInfoModal'
import { approveLead, rejectLead, requestInfo } from '../utils/api'

export default function PendingReview() {
  const { leads, loading, usingFallback, refresh, removeLead } = useLeads('pending')
  const [modal, setModal] = useState({ type: null, lead: null })
  const [actionLoading, setActionLoading] = useState(false)

  const handleApprove = async (leadId, advisorId, advisorName) => {
    setActionLoading(true)
    try {
      await approveLead(leadId, advisorId, advisorName)
      removeLead(leadId)
      setModal({ type: null, lead: null })
    } catch {
      removeLead(leadId)
      setModal({ type: null, lead: null })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (leadId, reason, note) => {
    setActionLoading(true)
    try {
      await rejectLead(leadId, reason, note)
      removeLead(leadId)
      setModal({ type: null, lead: null })
    } catch {
      removeLead(leadId)
      setModal({ type: null, lead: null })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestInfo = async (leadId, question) => {
    setActionLoading(true)
    try {
      await requestInfo(leadId, question)
      removeLead(leadId)
      setModal({ type: null, lead: null })
    } catch {
      removeLead(leadId)
      setModal({ type: null, lead: null })
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
          <h2 className="font-display text-2xl font-semibold text-navy-700">Pending Review</h2>
          <p className="text-sm text-navy-400 mt-0.5">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} awaiting your decision
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

      {leads.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-navy-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-navy-400 text-lg font-medium">All caught up</p>
          <p className="text-navy-300 text-sm mt-1">No leads are waiting for review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <LeadCard
              key={lead.leadId}
              lead={lead}
              variant="pending"
              onApprove={(l) => setModal({ type: 'approve', lead: l })}
              onReject={(l) => setModal({ type: 'reject', lead: l })}
              onRequestInfo={(l) => setModal({ type: 'info', lead: l })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal.type === 'approve' && modal.lead && (
        <ApproveModal
          lead={modal.lead}
          onConfirm={handleApprove}
          onClose={() => setModal({ type: null, lead: null })}
          loading={actionLoading}
        />
      )}
      {modal.type === 'reject' && modal.lead && (
        <RejectModal
          lead={modal.lead}
          onConfirm={handleReject}
          onClose={() => setModal({ type: null, lead: null })}
          loading={actionLoading}
        />
      )}
      {modal.type === 'info' && modal.lead && (
        <RequestInfoModal
          lead={modal.lead}
          onConfirm={handleRequestInfo}
          onClose={() => setModal({ type: null, lead: null })}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
