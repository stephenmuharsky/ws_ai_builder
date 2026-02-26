import { useState } from 'react'
import {
  formatAssets, formatIncome, formatProvince, formatTimeline, formatRisk,
  formatAdvisorSituation, timeAgo, formatTime, formatDate, parseGoals,
  getDisqualificationLabel,
} from '../utils/formatters'

const DQ_LABEL_MAP = {
  jurisdiction_not_served: 'Jurisdiction not served',
  below_asset_threshold: 'Below asset threshold',
  goal_mismatch: 'Service goals not offered',
}

const DQ_CONTEXT = {
  jurisdiction_not_served: {
    getDetail: (lead, assetsDisplay) => `Applicant province: ${formatProvince(lead.province)} (${lead.province})`,
    policy: 'NorthStar currently serves ON, BC, AB, QC.',
  },
  below_asset_threshold: {
    getDetail: (lead, assetsDisplay) => `Reported assets: ${assetsDisplay}`,
    policy: 'Minimum investable assets requirement: $100,000.',
  },
  goal_mismatch: {
    getDetail: (lead) => `Requested: ${lead.financialGoals || 'Not specified'}`,
    policy: 'NorthStar offers: Retirement, Tax, Estate, Investment, Education planning.',
  },
}

// Normalize DQ reasons: handle both new array format and old comma-separated string
function normalizeDqReasons(lead) {
  if (Array.isArray(lead.disqualificationReasons) && lead.disqualificationReasons.length > 0) {
    return {
      keys: lead.disqualificationReasons,
      labels: lead.disqualificationReasonsDisplay || lead.disqualificationReasons.map(r => DQ_LABEL_MAP[r] || r),
    }
  }
  // Old format: single comma-separated string in disqualificationReason
  const raw = lead.disqualificationReason || ''
  const keys = raw.split(',').map(s => s.trim()).filter(Boolean)
  return {
    keys,
    labels: keys.map(r => DQ_LABEL_MAP[r] || r),
  }
}

export default function DisqualifiedCard({ lead, onOverride, onConfirmReject, onRequestInfo, actionLoading }) {
  const [expanded, setExpanded] = useState(false)

  const goals = parseGoals(lead.financialGoals)
  const dq = normalizeDqReasons(lead)
  const assetsDisplay = lead.investableAssetsDisplay || formatAssets(lead.investableAssets)
  const incomeDisplay = lead.annualIncomeDisplay || formatIncome(lead.annualIncome)
  const isEmailSent = !!lead.rejectionEmailSentAt

  // Compute grace period: use backend value if available, otherwise calculate from submittedAt
  const GRACE_HOURS = 48
  let graceHoursRemaining = lead.graceHoursRemaining
  let gracePeriodExpired = lead.gracePeriodExpired
  if (graceHoursRemaining == null && lead.submittedAt) {
    const elapsedHours = (Date.now() - new Date(lead.submittedAt).getTime()) / 3600000
    graceHoursRemaining = GRACE_HOURS - elapsedHours
    gracePeriodExpired = graceHoursRemaining <= 0
  }
  const hasGraceData = graceHoursRemaining != null
  const graceActive = hasGraceData && !gracePeriodExpired && !isEmailSent
  const graceHours = Math.max(0, Math.round(graceHoursRemaining || 0))

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all duration-300 ${
      isEmailSent
        ? 'border-navy-100/40 opacity-55'
        : graceActive
          ? 'border-amber-200/70 hover:shadow-md hover:border-amber-300/70'
          : 'border-red-200/50 hover:shadow-md'
    }`}>
      {/* Header — always visible */}
      <div
        className="px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* DQ Badges + Grace Period Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {dq.labels.map((label, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                           bg-amber-50 text-amber-700 border border-amber-200/80"
              >
                {label}
              </span>
            ))}
            {isEmailSent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-navy-50 text-navy-400 border border-navy-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Rejection email sent
              </span>
            )}
          </div>

          {/* Grace period indicator — only show when grace data is available */}
          {!isEmailSent && hasGraceData && (
            <div className="flex-shrink-0">
              {graceActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {graceHours}h remaining
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-200">
                  Grace period expired
                </span>
              )}
            </div>
          )}
        </div>

        {/* Name + Details */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-display text-base font-semibold text-navy-700">
                {lead.fullName}
              </h3>
              <span className="text-xs text-navy-400">
                {formatProvince(lead.province)}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-sm font-medium text-navy-600">
                {assetsDisplay || 'Assets not reported'}
              </span>
              <span className="text-navy-200">|</span>
              <span className="text-xs text-navy-400">
                {goals.length > 0
                  ? goals.slice(0, 2).join(', ') + (goals.length > 2 ? ` +${goals.length - 2}` : '')
                  : lead.financialGoals || 'No goals specified'}
              </span>
            </div>

            <div className="mt-2">
              <span className="text-xs text-navy-300">{timeAgo(lead.submittedAt)}</span>
            </div>
          </div>

          {/* Expand toggle */}
          <button className="flex-shrink-0 p-1 text-navy-300 hover:text-navy-500 transition-colors">
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center gap-2 mt-4 pt-3 border-t border-navy-100/50"
          onClick={(e) => e.stopPropagation()}
        >
          {!isEmailSent && (
            <>
              <button
                onClick={() => onOverride(lead)}
                disabled={actionLoading}
                className="btn-override disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Override to Pending
              </button>
              <button
                onClick={() => onConfirmReject(lead)}
                disabled={actionLoading}
                className="btn-confirm-reject disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Confirm Rejection
              </button>
              <button
                onClick={() => onRequestInfo(lead)}
                disabled={actionLoading}
                className="btn-secondary-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Request Info
              </button>
            </>
          )}
          {isEmailSent && (
            <p className="text-xs text-navy-300 italic">Rejection processed — no further actions available.</p>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-navy-100/50 space-y-5 animate-[fadeIn_0.2s_ease-out]">
          {/* APPLICANT DETAILS */}
          <div className="mt-4">
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-3">
              Applicant Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <DetailField label="Email" value={lead.email} />
              <DetailField label="Phone" value={lead.phone} />
              <DetailField label="Annual Income" value={incomeDisplay} />
              <DetailField label="Timeline" value={formatTimeline(lead.investmentTimeline)} />
              <DetailField label="Risk Tolerance" value={formatRisk(lead.riskTolerance)} />
              <DetailField label="Advisor Status" value={formatAdvisorSituation(lead.currentAdvisorSituation)} />
            </div>
          </div>

          {/* WHY DISQUALIFIED */}
          <div>
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-3">
              Why Disqualified
            </p>
            <div className="space-y-2.5">
              {dq.keys.map((reason, i) => {
                const ctx = DQ_CONTEXT[reason] || {}
                const displayLabel = dq.labels[i] || reason
                return (
                  <div key={i} className="p-3.5 rounded-lg border border-amber-200/60 bg-amber-50/40">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800">{displayLabel}</p>
                        {ctx.getDetail && (
                          <p className="text-xs text-amber-700/80 mt-0.5">{ctx.getDetail(lead, assetsDisplay)}</p>
                        )}
                        {ctx.policy && (
                          <p className="text-xs text-navy-400 mt-1 italic">{ctx.policy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* FREE TEXT — critical for override decisions */}
          {lead.freeText && (
            <div>
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">
                Applicant Notes
              </p>
              <div className="p-4 bg-sky-50/50 border border-sky-200/50 rounded-lg">
                <p className="text-sm text-navy-700 leading-relaxed italic">
                  &ldquo;{lead.freeText}&rdquo;
                </p>
                <p className="text-[10px] text-sky-600 mt-2.5 font-semibold uppercase tracking-wider">
                  Review carefully — may contain context for override decisions
                </p>
              </div>
            </div>
          )}

          {/* SCHEDULING */}
          {lead.preferredDate && (
            <div>
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">
                Requested Schedule
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-light">
                  <p className="text-[10px] font-semibold text-navy-400 uppercase mb-1">Preferred</p>
                  <p className="text-navy-700 font-medium">
                    {formatDate(lead.preferredDate)} at {formatTime(lead.preferredTime)}
                  </p>
                </div>
                {lead.backupDate && (
                  <div className="p-3 rounded-lg bg-surface-light">
                    <p className="text-[10px] font-semibold text-navy-400 uppercase mb-1">Backup</p>
                    <p className="text-navy-700 font-medium">
                      {formatDate(lead.backupDate)} at {formatTime(lead.backupTime)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RAW FORM DATA */}
          <RawDataSection lead={lead} />
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value }) {
  if (!value) return null
  return (
    <div className="p-2.5 rounded-lg bg-surface-light">
      <p className="text-[10px] font-semibold text-navy-400 uppercase mb-0.5">{label}</p>
      <p className="text-sm text-navy-700 font-medium truncate">{value}</p>
    </div>
  )
}

function RawDataSection({ lead }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-navy-100/50 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] font-bold text-navy-300 uppercase tracking-widest hover:text-navy-500 transition-colors flex items-center gap-1"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        Raw Form Data
      </button>
      {open && (
        <div className="mt-2 p-3 bg-navy-50/40 rounded-lg text-xs text-navy-500 space-y-1.5 font-mono">
          <Row k="Lead ID" v={lead.leadId} />
          <Row k="Email" v={lead.email} />
          <Row k="Phone" v={lead.phone} />
          <Row k="Province" v={`${lead.province} (${formatProvince(lead.province)})`} />
          <Row k="Assets" v={assetsDisplay} />
          <Row k="Income" v={incomeDisplay} />
          <Row k="Timeline" v={formatTimeline(lead.investmentTimeline)} />
          <Row k="Risk" v={formatRisk(lead.riskTolerance)} />
          <Row k="Advisor Status" v={formatAdvisorSituation(lead.currentAdvisorSituation)} />
          <Row k="Submitted" v={lead.submittedAt} />
          {lead.freeText && <Row k="Notes" v={lead.freeText} />}
        </div>
      )}
    </div>
  )
}

function Row({ k, v }) {
  if (!v) return null
  return (
    <div className="flex gap-2">
      <span className="text-navy-400 font-semibold whitespace-nowrap">{k}:</span>
      <span className="text-navy-600 break-all">{v}</span>
    </div>
  )
}
