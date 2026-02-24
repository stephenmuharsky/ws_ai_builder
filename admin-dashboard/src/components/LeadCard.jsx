import { useState } from 'react'
import {
  formatAssets, formatTimeline, formatProvince, formatRisk,
  formatAdvisorSituation, timeAgo, formatTime, formatDate,
  parseGoals, safeJsonParse, getDisqualificationLabel,
} from '../utils/formatters'

export default function LeadCard({ lead, onApprove, onReject, onRequestInfo, onOverride, variant = 'pending' }) {
  const [expanded, setExpanded] = useState(false)

  const goals = parseGoals(lead.financialGoals)
  const riskFlags = safeJsonParse(lead.riskFlags, [])
  const advisorRanking = safeJsonParse(lead.advisorMatchRanking, [])
  const conversationStarters = safeJsonParse(lead.conversationStarters, [])
  const serviceTier = safeJsonParse(lead.recommendedServiceTier, {})
  const suggestedBooking = safeJsonParse(lead.suggestedBooking, null)
  const topAdvisor = advisorRanking[0] || {}
  const isAvailable = lead.availabilityStatus === 'PREFERRED_AVAILABLE' || lead.availabilityStatus === 'BACKUP_AVAILABLE'

  const priorityClass = {
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  }[lead.priorityScore] || 'badge-low'

  const isDisqualified = variant === 'rejected'

  return (
    <div className={`bg-white rounded-xl border ${isDisqualified ? 'border-navy-200/60 opacity-80' : 'border-navy-100'} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* Disqualification Banner */}
      {isDisqualified && lead.disqualificationReason && (
        <div className="px-5 py-2.5 bg-red-50 border-b border-red-100 rounded-t-xl">
          <p className="text-xs font-semibold text-red-700">
            Auto-rejected: {getDisqualificationLabel(lead.disqualificationReason)}
          </p>
        </div>
      )}

      {/* Collapsed Header */}
      <div
        className="px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Priority Badge */}
            <span className={`badge ${priorityClass} mt-0.5 flex-shrink-0`}>
              {lead.priorityScore || 'N/A'}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-display text-base font-semibold text-navy-700 truncate">
                  {lead.fullName}
                </h3>
                <span className="text-xs text-navy-400">
                  {formatProvince(lead.province)}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-sm font-medium text-navy-600">
                  {formatAssets(lead.investableAssets)}
                </span>
                <span className="text-navy-200">|</span>
                <span className="text-xs text-navy-400">
                  {goals.slice(0, 2).join(', ')}{goals.length > 2 ? ` +${goals.length - 2}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-navy-400">
                {topAdvisor.advisorName && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    {topAdvisor.advisorName}
                  </span>
                )}
                {!isDisqualified && (
                  <span className={`flex items-center gap-1 ${isAvailable ? 'text-accent-green' : 'text-amber-500'}`}>
                    {isAvailable ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    )}
                    {isAvailable ? 'Available' : 'Scheduling needed'}
                  </span>
                )}
                <span className="text-navy-300">{timeAgo(lead.submittedAt)}</span>
              </div>
            </div>
          </div>

          {/* Expand Toggle */}
          <button className="flex-shrink-0 p-1 text-navy-300 hover:text-navy-500 transition-colors">
            <svg className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Action Buttons (always visible) */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-navy-100/50" onClick={(e) => e.stopPropagation()}>
          {variant === 'pending' && (
            <>
              <button onClick={() => onApprove(lead)} className="btn-approve">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Approve
              </button>
              <button onClick={() => onReject(lead)} className="btn-reject">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Reject
              </button>
              <button onClick={() => onRequestInfo(lead)} className="btn-secondary-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                Request Info
              </button>
            </>
          )}
          {variant === 'rejected' && onOverride && (
            <button onClick={() => onOverride(lead)} className="btn-override">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
              Override to Pending
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-navy-100/50 space-y-5 animate-[fadeIn_0.2s_ease-out]">
          {/* AI Profile Summary */}
          {lead.profileSummary && (
            <div className="mt-4 p-4 bg-navy-50/60 border border-navy-100 rounded-lg">
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">AI Profile Summary</p>
              <p className="text-sm text-navy-700 leading-relaxed">{lead.profileSummary}</p>
            </div>
          )}

          {/* Service Tier */}
          {serviceTier.tierName && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent-green/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Recommended Service Tier</p>
                <p className="text-sm font-semibold text-navy-700">{serviceTier.tierName}</p>
                <p className="text-xs text-navy-400 mt-0.5">{serviceTier.reasoning}</p>
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {riskFlags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">Risk Flags</p>
              <div className="space-y-2">
                {riskFlags.map((flag, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-sm ${
                      flag.severity === 'HIGH'
                        ? 'bg-red-50/60 border-red-200 text-red-800'
                        : flag.severity === 'MEDIUM'
                          ? 'bg-amber-50/60 border-amber-200 text-amber-800'
                          : 'bg-blue-50/60 border-blue-200 text-blue-800'
                    }`}
                  >
                    <span className="font-semibold">{flag.flag}:</span>{' '}
                    <span className="font-normal opacity-90">{flag.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advisor Match Ranking */}
          {advisorRanking.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">Advisor Match Ranking</p>
              <div className="space-y-2">
                {advisorRanking.slice(0, 3).map((adv, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-light">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-accent-green text-white' : 'bg-navy-100 text-navy-500'
                    }`}>
                      {adv.matchScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-700">{adv.advisorName}</p>
                      <p className="text-xs text-navy-400 truncate">{adv.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Starters */}
          {conversationStarters.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">Conversation Starters</p>
              <ul className="space-y-2">
                {conversationStarters.map((starter, i) => (
                  <li key={i} className="flex gap-2 text-sm text-navy-600">
                    <span className="text-accent-green mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                    </span>
                    <span className="leading-relaxed">{starter}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scheduling Details */}
          {(lead.preferredDate || suggestedBooking) && (
            <div>
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">Scheduling</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-light">
                  <p className="text-[10px] font-semibold text-navy-400 uppercase mb-1">Preferred</p>
                  <p className="text-navy-700 font-medium">{formatDate(lead.preferredDate)} at {formatTime(lead.preferredTime)}</p>
                </div>
                {lead.backupDate && (
                  <div className="p-3 rounded-lg bg-surface-light">
                    <p className="text-[10px] font-semibold text-navy-400 uppercase mb-1">Backup</p>
                    <p className="text-navy-700 font-medium">{formatDate(lead.backupDate)} at {formatTime(lead.backupTime)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw Form Data (collapsible) */}
          <RawDataSection lead={lead} />
        </div>
      )}
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
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
          <Row k="Assets" v={formatAssets(lead.investableAssets)} />
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
