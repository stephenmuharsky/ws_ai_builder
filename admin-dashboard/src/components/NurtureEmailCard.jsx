import { useState } from 'react'
import { sendNurtureEmail, dismissNurtureEmail } from '../utils/api'

export default function NurtureEmailCard({ lead, onStatusChange }) {
  const [status, setStatus] = useState(lead.nurtureEmailStatus)
  const [dismissing, setDismissing] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [editableBody, setEditableBody] = useState(lead.nurtureEmailDraft || '')

  if (!lead.nurtureEmailDraft) return null

  // Already sent — show badge only
  if (status === 'APPROVED' || status === 'SENT') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-emerald-700">Nurture email sent</p>
      </div>
    )
  }

  if (status === 'DISMISSED') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-navy-50/40 border border-navy-100/50">
        <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-navy-400">Nurture email dismissed</p>
      </div>
    )
  }

  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50/60 border border-red-200/60">
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-red-700">Nurture email failed to send</p>
      </div>
    )
  }

  async function handleSendEmail() {
    setSending(true)
    setSendError(null)
    try {
      await sendNurtureEmail(
        lead.leadId,
        lead.email,
        lead.nurtureEmailSubject || '',
        editableBody
      )
      setStatus('SENT')
      onStatusChange?.('SENT')
    } catch (err) {
      console.error('Failed to send nurture email:', err)
      setSendError(err.message || 'Failed to send. Check n8n workflow.')
    } finally {
      setSending(false)
    }
  }

  async function handleDismiss() {
    setDismissing(true)
    try {
      const res = await dismissNurtureEmail(lead.leadId)
      if (res.success) {
        setStatus('DISMISSED')
        onStatusChange?.('DISMISSED')
      }
    } catch (err) {
      console.error('Failed to dismiss nurture email:', err)
      setStatus('DISMISSED')
      onStatusChange?.('DISMISSED')
    } finally {
      setDismissing(false)
    }
  }

  return (
    <div className="nurture-email-container">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-navy-100/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-green to-accent-green-dark flex items-center justify-center shadow-sm">
          <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-[0.15em]">Pre-Meeting Nurture Email</p>
          <p className="text-xs text-navy-300 mt-0.5">Review, edit, and send to client</p>
        </div>
        <span className="ml-auto badge bg-amber-50 text-amber-700 border border-amber-200">Pending Review</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* To */}
        <div className="p-3 rounded-lg bg-surface-light border border-navy-100/50">
          <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-1">To</p>
          <p className="text-sm font-semibold text-navy-700">{lead.email || 'No email on file'}</p>
        </div>

        {/* Subject Line */}
        <div className="p-3 rounded-lg bg-surface-light border border-navy-100/50">
          <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-1">Subject</p>
          <p className="text-sm font-semibold text-navy-700">{lead.nurtureEmailSubject}</p>
        </div>

        {/* Email Body — editable */}
        <div className="p-4 rounded-lg bg-white border border-navy-100">
          <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-2">Email Body <span className="text-navy-300 normal-case tracking-normal font-medium">(editable)</span></p>
          <textarea
            value={editableBody}
            onChange={(e) => setEditableBody(e.target.value)}
            className="w-full text-sm text-navy-600 leading-relaxed font-body bg-transparent border-0 outline-none resize-y min-h-[160px] max-h-[320px] p-0"
            spellCheck
          />
        </div>

        {/* Error banner */}
        {sendError && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50/80 border border-red-200/60">
            <svg className="w-4.5 h-4.5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{sendError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSendEmail}
            disabled={sending || !lead.email}
            className="btn-approve flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
            {sending ? 'Sending...' : 'Send Email'}
          </button>
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="btn-secondary-sm flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dismissing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {dismissing ? 'Dismissing...' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  )
}
