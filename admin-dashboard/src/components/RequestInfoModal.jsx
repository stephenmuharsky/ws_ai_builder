import { useState } from 'react'

export default function RequestInfoModal({ lead, onConfirm, onClose, loading }) {
  const [question, setQuestion] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-navy-700">Request More Info</h3>
              <p className="text-sm text-navy-400">{lead.fullName} ({lead.email})</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              What would you like to ask? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="e.g. Could you provide more details about your current investment portfolio and any existing registered accounts (RRSP, TFSA)?"
              className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg text-sm resize-none
                         focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20
                         placeholder-navy-300"
            />
          </div>

          <p className="text-xs text-navy-400 mb-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
            An email will be sent to {lead.fullName} with your question.
            The lead will be moved to "Awaiting Response" status.
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
              onClick={() => onConfirm(lead.leadId, question)}
              disabled={loading || !question.trim()}
              className="btn-secondary-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              )}
              Send Question
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
