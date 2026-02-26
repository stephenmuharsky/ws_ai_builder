import { useState } from 'react'
import { useLeads } from '../hooks/useLeads'
import DisqualifiedCard from '../components/DisqualifiedCard'
import ConfirmRejectModal from '../components/ConfirmRejectModal'
import RequestInfoModal from '../components/RequestInfoModal'
import { overrideLead, confirmRejectLead, requestInfo } from '../utils/api'

export default function AutoRejected() {
  const { leads, loading, refresh, removeLead, updateLead } = useLeads('auto_rejected')
  const [modal, setModal] = useState({ type: null, lead: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleOverride = async (lead) => {
    setActionLoading(true)
    try {
      await overrideLead(lead.leadId, 'Admin override — sent to AI enrichment')
      removeLead(lead.leadId)
      showToast('Lead sent to AI enrichment — will appear in New Leads shortly')
    } catch (err) {
      showToast(err.message || 'Override failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReject = async (leadId, reason, note) => {
    setActionLoading(true)
    try {
      await confirmRejectLead(leadId, reason, note)
      updateLead(leadId, { rejectionEmailSentAt: new Date().toISOString() })
      setModal({ type: null, lead: null })
      showToast('Rejection confirmed — email will be sent')
    } catch (err) {
      showToast(err.message || 'Failed to confirm rejection', 'error')
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
      showToast('Question sent — lead moved to Awaiting Info')
    } catch (err) {
      showToast(err.message || 'Failed to send question', 'error')
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
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium
          animate-[fadeIn_0.2s_ease-out] transition-opacity
          ${toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-navy-700 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-navy-700">Flagged</h2>
          <p className="text-sm text-navy-400 mt-0.5">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} disqualified — review for overrides
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
          <p className="text-navy-400 text-lg font-medium">No auto-rejected leads</p>
          <p className="text-navy-300 text-sm mt-1">All incoming leads have passed the disqualification rules.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <DisqualifiedCard
              key={lead.leadId}
              lead={lead}
              onOverride={handleOverride}
              onConfirmReject={(l) => setModal({ type: 'reject', lead: l })}
              onRequestInfo={(l) => setModal({ type: 'info', lead: l })}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal.type === 'reject' && modal.lead && (
        <ConfirmRejectModal
          lead={modal.lead}
          onConfirm={handleConfirmReject}
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
