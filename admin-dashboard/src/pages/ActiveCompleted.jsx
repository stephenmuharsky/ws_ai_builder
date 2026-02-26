import { useState } from 'react'
import { useLeads } from '../hooks/useLeads'
import { formatAssets, formatDate, formatTime, timeAgo } from '../utils/formatters'
import ConsultationPrepBrief from '../components/ConsultationPrepBrief'
import NurtureEmailCard from '../components/NurtureEmailCard'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'OUTREACH_IN_PROGRESS', label: 'Outreach In Progress' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'UNRESPONSIVE', label: 'Unresponsive' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
]

export default function ActiveCompleted() {
  const { leads, loading, usingFallback, refresh } = useLeads('active')
  const [filter, setFilter] = useState('all')
  const [expandedLeadId, setExpandedLeadId] = useState(null)

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  function toggleExpand(lead) {
    if (!isExpandable(lead)) return
    setExpandedLeadId(prev => prev === lead.leadId ? null : lead.leadId)
  }

  function isExpandable(lead) {
    return lead.status === 'BOOKED' && (lead.consultationPrepBrief || lead.nurtureEmailDraft)
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
          <h2 className="font-display text-2xl font-semibold text-navy-700">Active Pipeline</h2>
          <p className="text-sm text-navy-400 mt-0.5">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
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

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const count = f.value === 'all' ? leads.length : leads.filter(l => l.status === f.value).length
          if (count === 0 && f.value !== 'all') return null
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors
                ${filter === f.value
                  ? 'bg-navy-700 text-white'
                  : 'bg-white text-navy-500 border border-navy-200 hover:bg-navy-50'
                }
              `}
            >
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-navy-400 text-lg font-medium">No leads in this category</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-surface-light">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-navy-400 uppercase tracking-widest">Client</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-navy-400 uppercase tracking-widest hidden lg:table-cell">Assets</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-navy-400 uppercase tracking-widest">Advisor</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-navy-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-navy-400 uppercase tracking-widest hidden md:table-cell">Last Activity</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-navy-400 uppercase tracking-widest hidden lg:table-cell">Consultation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const canExpand = isExpandable(lead)
                const isExpanded = expandedLeadId === lead.leadId

                return (
                  <LeadRow
                    key={lead.leadId}
                    lead={lead}
                    canExpand={canExpand}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpand(lead)}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LeadRow({ lead, canExpand, isExpanded, onToggle }) {
  return (
    <>
      <tr
        className={`border-b border-navy-100/50 last:border-0 transition-colors ${
          canExpand ? 'cursor-pointer hover:bg-surface-light/80' : 'hover:bg-surface-light/50'
        } ${isExpanded ? 'bg-surface-light/60' : ''}`}
        onClick={onToggle}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div>
              <p className="font-semibold text-navy-700">{lead.fullName}</p>
              <p className="text-xs text-navy-400">{lead.email}</p>
            </div>
            {canExpand && (
              <div className="flex items-center gap-1 ml-1">
                {lead.consultationPrepBrief && (
                  <span className="w-2 h-2 rounded-full bg-navy-600" title="Prep brief available" />
                )}
                {lead.nurtureEmailStatus === 'PENDING_REVIEW' && (
                  <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" title="Nurture email pending" />
                )}
              </div>
            )}
          </div>
        </td>
        <td className="px-5 py-3.5 hidden lg:table-cell text-navy-600">
          {formatAssets(lead.investableAssets)}
        </td>
        <td className="px-5 py-3.5 text-navy-600">
          {lead.assignedAdvisorName || '--'}
        </td>
        <td className="px-5 py-3.5">
          <StatusBadge status={lead.status} />
        </td>
        <td className="px-5 py-3.5 hidden md:table-cell text-navy-400 text-xs">
          {timeAgo(lead.lastEmailSentAt || lead.approvedAt || lead.submittedAt)}
        </td>
        <td className="px-5 py-3.5 hidden lg:table-cell text-navy-600 text-xs">
          <div className="flex items-center gap-2">
            {lead.appointmentDatetime ? (
              <>
                {formatDate(lead.appointmentDatetime.split('T')[0])}
                {' at '}
                {formatTime(lead.appointmentDatetime.split('T')[1]?.slice(0, 5))}
              </>
            ) : '--'}
            {canExpand && (
              <svg className={`w-4 h-4 text-navy-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <tr>
          <td colSpan="6" className="p-0">
            <div className="px-6 py-5 bg-gradient-to-b from-surface-light/80 to-white border-b border-navy-100 animate-[fadeIn_0.2s_ease-out]">
              {/* Lead Profile Summary */}
              {lead.profileSummary && (
                <div className="mb-5 p-4 bg-navy-50/60 border border-navy-100 rounded-lg">
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">AI Profile Summary</p>
                  <p className="text-sm text-navy-700 leading-relaxed">{lead.profileSummary}</p>
                </div>
              )}

              <div className="space-y-5">
                {/* Consultation Prep Brief */}
                {lead.consultationPrepBrief && (
                  <ConsultationPrepBrief brief={lead.consultationPrepBrief} />
                )}

                {/* Nurture Email Card */}
                {lead.nurtureEmailDraft && (
                  <NurtureEmailCard lead={lead} />
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function StatusBadge({ status }) {
  const styles = {
    APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
    OUTREACH_IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
    BOOKED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UNRESPONSIVE: 'bg-gray-100 text-gray-600 border-gray-200',
    COMPLETED: 'bg-accent-green/10 text-accent-green-dark border-accent-green/20',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
    CANCELLED_BY_LEAD: 'bg-gray-100 text-gray-500 border-gray-200',
  }

  const labels = {
    APPROVED: 'Approved',
    OUTREACH_IN_PROGRESS: 'Outreach',
    BOOKED: 'Booked',
    UNRESPONSIVE: 'Unresponsive',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
    CANCELLED_BY_LEAD: 'Cancelled',
  }

  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  )
}
