const ASSET_RANGES = [
  { value: 'under_25k', label: 'Under $25,000' },
  { value: '25k_100k', label: '$25,000 -- $100,000' },
  { value: '100k_250k', label: '$100,000 -- $250,000' },
  { value: '250k_500k', label: '$250,000 -- $500,000' },
  { value: '500k_1m', label: '$500,000 -- $1,000,000' },
  { value: '1m_plus', label: '$1,000,000+' },
]

const INCOME_RANGES = [
  { value: 'under_50k', label: 'Under $50,000' },
  { value: '50k_100k', label: '$50,000 -- $100,000' },
  { value: '100k_200k', label: '$100,000 -- $200,000' },
  { value: '200k_500k', label: '$200,000 -- $500,000' },
  { value: '500k_plus', label: '$500,000+' },
]

const FINANCIAL_GOALS = [
  { value: 'Retirement Planning', label: 'Retirement Planning', desc: 'Build a sustainable income for retirement' },
  { value: 'Wealth Growth & Accumulation', label: 'Wealth Growth & Accumulation', desc: 'Grow your portfolio over time' },
  { value: 'Tax Optimization', label: 'Tax Optimization', desc: 'Minimize your tax burden strategically' },
  { value: 'Estate Planning', label: 'Estate Planning', desc: 'Protect and transfer your wealth' },
  { value: 'Debt Management', label: 'Debt Management', desc: 'Strategic approach to managing debt' },
  { value: 'Education Savings (RESP)', label: 'Education Savings (RESP)', desc: 'Save for your children\'s education' },
]

export default function FinancialProfile({ formData, updateField, errors }) {
  const toggleGoal = (goal) => {
    const current = formData.financialGoals
    if (current.includes(goal)) {
      updateField('financialGoals', current.filter((g) => g !== goal))
    } else {
      updateField('financialGoals', [...current, goal])
    }
  }

  return (
    <div className="space-y-8">
      {/* Investable Assets */}
      <div>
        <label htmlFor="investableAssets" className="input-label">
          Investable Assets Range <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-navy-400 mb-3">
          Include savings, investments, and liquid assets. Exclude primary residence.
        </p>
        <select
          id="investableAssets"
          value={formData.investableAssets}
          onChange={(e) => updateField('investableAssets', e.target.value)}
          className={`input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238490ab%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${errors.investableAssets ? 'error' : ''} ${!formData.investableAssets ? 'text-navy-300' : ''}`}
        >
          <option value="">Select a range</option>
          {ASSET_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {errors.investableAssets && <p className="mt-1.5 text-sm text-red-500">{errors.investableAssets}</p>}
      </div>

      {/* Annual Income */}
      <div>
        <label htmlFor="annualIncome" className="input-label">
          Annual Household Income <span className="text-red-400">*</span>
        </label>
        <select
          id="annualIncome"
          value={formData.annualIncome}
          onChange={(e) => updateField('annualIncome', e.target.value)}
          className={`input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238490ab%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${errors.annualIncome ? 'error' : ''} ${!formData.annualIncome ? 'text-navy-300' : ''}`}
        >
          <option value="">Select a range</option>
          {INCOME_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {errors.annualIncome && <p className="mt-1.5 text-sm text-red-500">{errors.annualIncome}</p>}
      </div>

      {/* Financial Goals */}
      <div>
        <label className="input-label">
          Primary Financial Goals <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-navy-400 mb-3">Select all that apply.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FINANCIAL_GOALS.map((goal) => {
            const checked = formData.financialGoals.includes(goal.value)
            return (
              <label
                key={goal.value}
                className={`
                  relative flex items-start gap-3 p-4 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${checked
                    ? 'border-accent-green bg-accent-green/[0.04] ring-1 ring-accent-green/30'
                    : 'border-navy-200 hover:border-navy-300 bg-white'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleGoal(goal.value)}
                  className="mt-0.5 flex-shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-navy-700 block">{goal.label}</span>
                  <span className="text-xs text-navy-400 mt-0.5 block">{goal.desc}</span>
                </div>
              </label>
            )
          })}
        </div>
        {errors.financialGoals && <p className="mt-2 text-sm text-red-500">{errors.financialGoals}</p>}
      </div>
    </div>
  )
}
