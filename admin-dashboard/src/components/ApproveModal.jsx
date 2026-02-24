import { useState } from 'react'
import { sampleAdvisors } from '../data/sampleLeads'
import { safeJsonParse, formatDate, formatTime } from '../utils/formatters'

export default function ApproveModal({ lead, onConfirm, onClose, loading }) {
  const advisorRanking = safeJsonParse(lead.advisorMatchRanking, [])
  const suggestedBooking = safeJsonParse(lead.suggestedBooking, null)
  const topAdvisor = advisorRanking[0] || {}
  const isAvailable = lead.availabilityStatus === 'PREFERRED_AVAILABLE' || lead.availabilityStatus === 'BACKUP_AVAILABLE'

  const [selectedAdvisorId, setSelectedAdvisorId] = useState(topAdvisor.advisorId || '')
  const selectedAdvisor = sampleAdvisors.find(a => a.advisorId === selectedAdvisorId) || {}

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
              {sampleAdvisors.map((adv) => {
                const match = advisorRanking.find(r => r.advisorId === adv.advisorId)
                return (
                  <option key={adv.advisorId} value={adv.advisorId}>
                    {adv.advisorName}
                    {match ? ` (Score: ${match.matchScore})` : ''}
                    {adv.advisorId === topAdvisor.advisorId ? ' -- AI Recommended' : ''}
                  </option>
                )
              })}
            </select>
            {topAdvisor.reasoning && (
              <p className="mt-1.5 text-xs text-navy-400">
                AI recommendation: {topAdvisor.reasoning}
              </p>
            )}
          </div>

          {/* Booking Status */}
          <div className="p-4 rounded-lg border mb-5">
            {isAvailable && suggestedBooking ? (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-navy-700">Consultation will be booked</p>
                  <p className="text-sm text-navy-500 mt-0.5">
                    {formatDate(suggestedBooking.date)} at {formatTime(suggestedBooking.time)} with {selectedAdvisor.advisorName || topAdvisor.advisorName}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-navy-700">Email outreach will begin</p>
                  <p className="text-sm text-navy-400 mt-0.5">
                    Preferred time is unavailable. Automated email will be sent to find a suitable time with {selectedAdvisor.advisorName || topAdvisor.advisorName}.
                  </p>
                </div>
              </div>
            )}
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
              onClick={() => onConfirm(lead.leadId, selectedAdvisorId, selectedAdvisor.advisorName || '')}
              disabled={loading}
              className="btn-approve"
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
