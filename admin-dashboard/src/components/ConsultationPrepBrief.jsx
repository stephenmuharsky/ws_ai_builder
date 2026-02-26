import { useState } from 'react'
import { safeJsonParse } from '../utils/formatters'

export default function ConsultationPrepBrief({ brief }) {
  const [expanded, setExpanded] = useState(true)
  const data = safeJsonParse(brief, null)

  if (!data) return null

  return (
    <div className="prep-brief-container">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-[0.15em]">Consultation Prep Brief</p>
            <p className="text-xs text-navy-300 mt-0.5">AI-generated meeting preparation</p>
          </div>
        </div>
        <svg className={`w-5 h-5 text-navy-300 group-hover:text-navy-500 transition-all duration-300 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 animate-[fadeIn_0.25s_ease-out]">
          {/* Executive Summary — Highlighted */}
          {data.executiveSummary && (
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-navy-700 to-navy-800 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-green mb-2">Executive Summary</p>
                <p className="text-sm leading-relaxed text-navy-100">{data.executiveSummary}</p>
              </div>
            </div>
          )}

          {/* Financial Snapshot */}
          {data.financialSnapshot && (
            <BriefSection
              icon={<FinanceIcon />}
              title="Financial Snapshot"
              color="emerald"
            >
              <div className="space-y-3">
                {data.financialSnapshot.assetContext && (
                  <SnapshotRow label="Asset Context" value={data.financialSnapshot.assetContext} />
                )}
                {data.financialSnapshot.incomeAssetDynamic && (
                  <SnapshotRow label="Income-Asset Dynamic" value={data.financialSnapshot.incomeAssetDynamic} />
                )}
                {data.financialSnapshot.wealthTrajectory && (
                  <SnapshotRow label="Wealth Trajectory" value={data.financialSnapshot.wealthTrajectory} />
                )}
              </div>
            </BriefSection>
          )}

          {/* Goal Analysis */}
          {data.goalAnalysis?.length > 0 && (
            <BriefSection
              icon={<TargetIcon />}
              title="Goal Analysis"
              color="blue"
            >
              <div className="space-y-4">
                {data.goalAnalysis.map((goal, i) => (
                  <GoalCard key={i} goal={goal} index={i} />
                ))}
              </div>
            </BriefSection>
          )}

          {/* Client Psychology Notes */}
          {data.clientPsychologyNotes && (
            <BriefSection
              icon={<BrainIcon />}
              title="Client Psychology Notes"
              color="violet"
            >
              <div className="space-y-3">
                {data.clientPsychologyNotes.riskProfile && (
                  <PsychologyRow label="Risk Profile" value={data.clientPsychologyNotes.riskProfile} />
                )}
                {data.clientPsychologyNotes.advisorRelationship && (
                  <PsychologyRow label="Advisor Relationship" value={data.clientPsychologyNotes.advisorRelationship} />
                )}
                {data.clientPsychologyNotes.decisionMakingStyle && (
                  <PsychologyRow label="Decision-Making Style" value={data.clientPsychologyNotes.decisionMakingStyle} />
                )}
              </div>
            </BriefSection>
          )}

          {/* Meeting Agenda */}
          {data.meetingAgenda?.length > 0 && (
            <BriefSection
              icon={<ClockIcon />}
              title="Meeting Agenda"
              color="amber"
            >
              <div className="rounded-lg border border-navy-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy-50/80">
                      <th className="text-left px-3 py-2 text-[9px] font-bold text-navy-400 uppercase tracking-widest w-24">Time</th>
                      <th className="text-left px-3 py-2 text-[9px] font-bold text-navy-400 uppercase tracking-widest">Activity</th>
                      <th className="text-left px-3 py-2 text-[9px] font-bold text-navy-400 uppercase tracking-widest hidden md:table-cell">Advisor Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.meetingAgenda.map((item, i) => (
                      <tr key={i} className="border-t border-navy-100/50 hover:bg-surface-light/50 transition-colors">
                        <td className="px-3 py-2.5 text-xs font-mono font-semibold text-navy-500 whitespace-nowrap">{item.timeBlock}</td>
                        <td className="px-3 py-2.5 text-sm font-medium text-navy-700">{item.activity}</td>
                        <td className="px-3 py-2.5 text-xs text-navy-400 hidden md:table-cell">{item.advisorNotes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BriefSection>
          )}

          {/* Documents to Request */}
          {data.documentsToRequest?.length > 0 && (
            <BriefSection
              icon={<FolderIcon />}
              title="Documents to Request"
              color="sky"
            >
              <ul className="space-y-2">
                {data.documentsToRequest.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-navy-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                    <span className="leading-relaxed">{doc}</span>
                  </li>
                ))}
              </ul>
            </BriefSection>
          )}

          {/* Red Flags & Landmines */}
          {data.redFlagsAndLandmines?.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/60">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-[0.15em]">Red Flags & Landmines</p>
              </div>
              <ul className="space-y-2">
                {data.redFlagsAndLandmines.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-red-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="leading-relaxed">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competitive Intelligence */}
          {data.competitiveIntelligence && (
            <BriefSection
              icon={<ShieldIcon />}
              title="Competitive Intelligence"
              color="indigo"
            >
              <p className="text-sm text-navy-600 leading-relaxed">{data.competitiveIntelligence}</p>
            </BriefSection>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────

const SECTION_BG = {
  emerald: 'bg-emerald-100',
  blue: 'bg-blue-100',
  violet: 'bg-violet-100',
  amber: 'bg-amber-100',
  sky: 'bg-sky-100',
  indigo: 'bg-indigo-100',
}

function BriefSection({ icon, title, color, children }) {
  const [open, setOpen] = useState(true)
  const bgClass = SECTION_BG[color] || 'bg-navy-100'

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 mb-3 group w-full text-left"
      >
        <div className={`w-7 h-7 rounded-lg ${bgClass} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-[0.15em] flex-1">{title}</p>
        <svg className={`w-3.5 h-3.5 text-navy-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="ml-[38px]">{children}</div>}
    </div>
  )
}

function GoalCard({ goal, index }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <div className="p-3.5 rounded-lg bg-surface-light border border-navy-100/50">
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-700">{goal.goal}</p>
        <svg className={`w-3.5 h-3.5 text-navy-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {goal.keyQuestions?.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-1.5">Key Questions</p>
              <ul className="space-y-1">
                {goal.keyQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                    <span className="text-accent-green mt-0.5 flex-shrink-0">?</span>
                    <span className="leading-relaxed">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {goal.quickMath && (
            <div className="p-2.5 rounded-md bg-white border border-navy-100/50">
              <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-1">Quick Math</p>
              <p className="text-xs text-navy-600 leading-relaxed font-mono">{goal.quickMath}</p>
            </div>
          )}
          {goal.canadianContext && (
            <div className="p-2.5 rounded-md bg-amber-50/60 border border-amber-200/40">
              <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Canadian Context</p>
              <p className="text-xs text-amber-800 leading-relaxed">{goal.canadianContext}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SnapshotRow({ label, value }) {
  return (
    <div className="p-3 rounded-lg bg-surface-light">
      <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm text-navy-600 leading-relaxed">{value}</p>
    </div>
  )
}

function PsychologyRow({ label, value }) {
  return (
    <div className="p-3 rounded-lg bg-violet-50/40 border border-violet-100/50">
      <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm text-navy-600 leading-relaxed">{value}</p>
    </div>
  )
}

// ── Icons ───────────────────────────────────────────────────────────

function FinanceIcon() {
  return <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
}

function TargetIcon() {
  return <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
}

function BrainIcon() {
  return <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
}

function ClockIcon() {
  return <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function FolderIcon() {
  return <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
}

function ShieldIcon() {
  return <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
}
