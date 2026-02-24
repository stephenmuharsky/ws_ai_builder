import { useState } from 'react'

const REJECTION_REASONS = [
  { value: 'below_threshold', label: 'Below our minimum threshold' },
  { value: 'not_a_fit', label: 'Not a good fit for our services' },
  { value: 'incomplete_info', label: 'Incomplete or unclear information' },
  { value: 'other', label: 'Other' },
]

export default function RejectModal({ lead, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-navy-700">Reject Lead</h3>
              <p className="text-sm text-navy-400">{lead.fullName}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Reason for rejection <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg text-sm
                         focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20"
            >
              <option value="">Select a reason</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Additional notes (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Any details for internal records..."
              className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg text-sm resize-none
                         focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20
                         placeholder-navy-300"
            />
          </div>

          <p className="text-xs text-navy-400 mb-5 p-3 bg-amber-50 rounded-lg border border-amber-100">
            The client will receive a personalized rejection email with appropriate next-step resources
            based on the selected reason.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-navy-500 hover:text-navy-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(lead.leadId, reason, note)}
              disabled={loading || !reason}
              className="btn-reject disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
