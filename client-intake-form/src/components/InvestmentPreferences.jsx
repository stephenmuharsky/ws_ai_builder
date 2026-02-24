const TIMELINES = [
  { value: 'under_1yr', label: 'Less than 1 year' },
  { value: '1_3yr', label: '1 -- 3 years' },
  { value: '3_5yr', label: '3 -- 5 years' },
  { value: '5_10yr', label: '5 -- 10 years' },
  { value: '10_plus', label: '10+ years' },
]

const RISK_LEVELS = [
  {
    value: 'conservative',
    label: 'Conservative',
    desc: 'Preserve what I have. I am comfortable with lower returns for stability.',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    activeColor: 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    value: 'moderate',
    label: 'Moderate',
    desc: 'Balanced approach. Some risk for growth, but protect the downside.',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    activeColor: 'bg-amber-50 border-amber-500 ring-1 ring-amber-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    desc: 'Maximize growth. I can handle significant short-term volatility.',
    color: 'bg-red-50 border-red-200 text-red-700',
    activeColor: 'bg-red-50 border-red-500 ring-1 ring-red-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
]

const ADVISOR_SITUATIONS = [
  { value: 'switching', label: 'I currently have a financial advisor and am considering switching' },
  { value: 'never_had', label: 'I have never worked with a financial advisor' },
  { value: 'previously_had', label: 'I previously had an advisor but do not currently' },
]

export default function InvestmentPreferences({ formData, updateField, errors }) {
  return (
    <div className="space-y-8">
      {/* Investment Timeline */}
      <div>
        <label className="input-label">
          Investment Timeline <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-navy-400 mb-3">
          How long do you plan to keep your investments before needing access?
        </p>
        <div className="space-y-2">
          {TIMELINES.map((t) => (
            <label
              key={t.value}
              className={`
                flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer
                transition-all duration-200
                ${formData.investmentTimeline === t.value
                  ? 'border-accent-green bg-accent-green/[0.04] ring-1 ring-accent-green/30'
                  : 'border-navy-200 hover:border-navy-300 bg-white'
                }
              `}
            >
              <input
                type="radio"
                name="investmentTimeline"
                value={t.value}
                checked={formData.investmentTimeline === t.value}
                onChange={(e) => updateField('investmentTimeline', e.target.value)}
              />
              <span className="text-sm font-medium text-navy-700">{t.label}</span>
            </label>
          ))}
        </div>
        {errors.investmentTimeline && <p className="mt-2 text-sm text-red-500">{errors.investmentTimeline}</p>}
      </div>

      {/* Risk Tolerance */}
      <div>
        <label className="input-label">
          Risk Tolerance <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-navy-400 mb-3">
          Which best describes your comfort level with investment risk?
        </p>
        <div className="space-y-3">
          {RISK_LEVELS.map((risk) => {
            const selected = formData.riskTolerance === risk.value
            return (
              <label
                key={risk.value}
                className={`
                  flex items-start gap-4 p-4 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${selected ? risk.activeColor : 'border-navy-200 hover:border-navy-300 bg-white'}
                `}
              >
                <input
                  type="radio"
                  name="riskTolerance"
                  value={risk.value}
                  checked={selected}
                  onChange={(e) => updateField('riskTolerance', e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={selected ? '' : 'text-navy-400'}>{risk.icon}</span>
                    <span className="text-sm font-semibold text-navy-700">{risk.label}</span>
                  </div>
                  <p className="text-xs text-navy-400 mt-1 leading-relaxed">{risk.desc}</p>
                </div>
              </label>
            )
          })}
        </div>
        {errors.riskTolerance && <p className="mt-2 text-sm text-red-500">{errors.riskTolerance}</p>}
      </div>

      {/* Current Advisor Situation */}
      <div>
        <label className="input-label">
          Current Advisor Situation <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          {ADVISOR_SITUATIONS.map((s) => (
            <label
              key={s.value}
              className={`
                flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer
                transition-all duration-200
                ${formData.currentAdvisorSituation === s.value
                  ? 'border-accent-green bg-accent-green/[0.04] ring-1 ring-accent-green/30'
                  : 'border-navy-200 hover:border-navy-300 bg-white'
                }
              `}
            >
              <input
                type="radio"
                name="currentAdvisorSituation"
                value={s.value}
                checked={formData.currentAdvisorSituation === s.value}
                onChange={(e) => updateField('currentAdvisorSituation', e.target.value)}
              />
              <span className="text-sm text-navy-700">{s.label}</span>
            </label>
          ))}
        </div>
        {errors.currentAdvisorSituation && <p className="mt-2 text-sm text-red-500">{errors.currentAdvisorSituation}</p>}
      </div>
    </div>
  )
}
