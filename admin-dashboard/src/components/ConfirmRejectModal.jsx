import { useState } from 'react'

const REJECTION_REASONS = [
  { value: 'not_a_fit', label: 'Not a fit for our services' },
  { value: 'below_threshold', label: 'Below threshold on review' },
  { value: 'other', label: 'Other' },
]

export default function ConfirmRejectModal({ lead, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-navy-700">
                Confirm Rejection
              </h3>
              <p className="text-xs text-navy-400">
                {lead.fullName} — skips 48h grace period
              </p>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-navy-600 mb-1">
              Rejection reason <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-navy-200 rounded-lg text-sm
                         focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20"
            >
              <option value="">Select a reason</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-navy-600 mb-1">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 bg-white border border-navy-200 rounded-lg text-sm resize-none
                         focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20
                         placeholder-navy-300"
            />
          </div>

          <p className="text-[11px] text-amber-700 mb-4 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
            This immediately triggers a rejection email — no 48-hour grace period.
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-navy-500 hover:text-navy-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(lead.leadId, reason, note)}
              disabled={loading || !reason}
              className="btn-confirm-reject disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
