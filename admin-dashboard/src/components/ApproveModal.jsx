import { useState } from 'react'
import { useAdvisors } from '../hooks/useAdvisors'
import { safeJsonParse, formatDate, formatTime } from '../utils/formatters'

export default function ApproveModal({ lead, onConfirm, onClose, loading }) {
  const { advisors } = useAdvisors()
  const advisorRanking = safeJsonParse(lead.advisorMatchRanking, [])
  const suggestedBooking = safeJsonParse(lead.suggestedBooking, null)
  const topAdvisor = advisorRanking[0] || {}

  const [selectedAdvisorId, setSelectedAdvisorId] = useState(topAdvisor.advisorId || '')
  const selectedAdvisor = advisors.find(a => a.advisorId === selectedAdvisorId) || {}
  const selectedMatch = advisorRanking.find(r => r.advisorId === selectedAdvisorId)
  const selectedAdvisorName = selectedAdvisor.advisorName || selectedMatch?.advisorName || topAdvisor.advisorName || 'Selected Advisor'

  // Cross-check: does the selected advisor match the one availability was verified for?
  const isVerifiedAdvisor = suggestedBooking && selectedAdvisorId === suggestedBooking.advisorId
  const hasAvailability = lead.availabilityStatus === 'PREFERRED_AVAILABLE' || lead.availabilityStatus === 'BACKUP_AVAILABLE'
  const canInstantBook = isVerifiedAdvisor && hasAvailability

  function renderBookingStatus() {
    if (!selectedAdvisorId) {
      return (
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border-2 border-navy-200 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-navy-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-500">Select an advisor</p>
            <p className="text-sm text-navy-400 mt-0.5">Choose an advisor above to see booking availability.</p>
          </div>
        </div>
      )
    }

    if (canInstantBook) {
      return (
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-accent-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-navy-700">Consultation will be instantly booked</p>
            <p className="text-sm text-navy-500 mt-0.5">
              {formatDate(suggestedBooking.date)} at {formatTime(suggestedBooking.time)} with {selectedAdvisorName}
            </p>
          </div>
        </div>
      )
    }

    // Different advisor selected, or scheduling required for the verified advisor
    const isUnverified = !isVerifiedAdvisor
    return (
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-navy-700">Email outreach will begin</p>
          <p className="text-sm text-navy-400 mt-0.5">
            {isUnverified
              ? `Availability hasn\u2019t been verified for ${selectedAdvisorName}. Automated email will be sent to find a suitable time.`
              : `Preferred time is unavailable. Automated email will be sent to find a suitable time with ${selectedAdvisorName}.`
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-accent-green/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-navy-700">Approve Lead</h3>
              <p className="text-sm text-navy-400">{lead.fullName}</p>
            </div>
          </div>

          {/* Advisor Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Assigned Advisor
            </label>
            <select
              value={selectedAdvisorId}
              onChange={(e) => setSelectedAdvisorId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg text-sm
                         focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20"
            >
              {advisorRanking.map((match) => {
                const adv = advisors.find(a => a.advisorId === match.advisorId)
                const name = match.advisorName || (adv && adv.advisorName) || match.advisorId
                return (
                  <option key={match.advisorId} value={match.advisorId}>
                    {name} (Score: {match.matchScore})
                    {match.advisorId === topAdvisor.advisorId ? ' -- AI Recommended' : ''}
                  </option>
                )
              })}
              {advisors
                .filter(adv => !advisorRanking.some(r => r.advisorId === adv.advisorId))
                .map((adv) => (
                  <option key={adv.advisorId} value={adv.advisorId}>
                    {adv.advisorName}
                  </option>
                ))}
            </select>
            {selectedMatch?.reasoning && (
              <p className="mt-1.5 text-xs text-navy-400">
                AI recommendation: {selectedMatch.reasoning}
              </p>
            )}
          </div>

          {/* Booking Status — dynamic based on selected advisor */}
          <div className={`p-4 rounded-lg border mb-5 transition-colors duration-200 ${
            canInstantBook
              ? 'bg-emerald-50/40 border-emerald-200/60'
              : selectedAdvisorId
                ? 'bg-amber-50/40 border-amber-200/60'
                : 'bg-navy-50/30 border-navy-100'
          }`}>
            {renderBookingStatus()}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-navy-500 hover:text-navy-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(lead.leadId, selectedAdvisorId, selectedAdvisorName)}
              disabled={loading || !selectedAdvisorId}
              className="btn-approve disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              )}
              Confirm Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
