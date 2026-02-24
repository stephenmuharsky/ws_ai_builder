const FIRM_NAME = import.meta.env.VITE_FIRM_NAME || 'NorthStar Wealth Advisory'

export default function AdditionalContext({ formData, updateField, errors }) {
  const charCount = formData.freeText.length
  const maxChars = 1000

  return (
    <div className="space-y-8">
      {/* Free Text */}
      <div>
        <label htmlFor="freeText" className="input-label">
          Additional Context
        </label>
        <p className="text-xs text-navy-400 mb-3">
          Is there anything else we should know about your financial situation or goals?
          This helps us prepare for your consultation.
        </p>
        <textarea
          id="freeText"
          rows={5}
          maxLength={maxChars}
          placeholder="e.g. I recently sold my business and need guidance on investing the proceeds. I'm also interested in setting up a family trust..."
          value={formData.freeText}
          onChange={(e) => updateField('freeText', e.target.value)}
          className="input-field resize-none"
        />
        <div className="mt-1.5 flex justify-end">
          <span className={`text-xs ${charCount > 900 ? 'text-amber-500' : 'text-navy-300'}`}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* Consent */}
      <div>
        <label
          className={`
            flex items-start gap-3 p-5 rounded-lg border cursor-pointer
            transition-all duration-200
            ${formData.consentGiven
              ? 'border-accent-green bg-accent-green/[0.04] ring-1 ring-accent-green/30'
              : errors.consentGiven
                ? 'border-red-300 bg-red-50/50'
                : 'border-navy-200 hover:border-navy-300 bg-white'
            }
          `}
        >
          <input
            type="checkbox"
            checked={formData.consentGiven}
            onChange={(e) => updateField('consentGiven', e.target.checked)}
            className="mt-0.5 flex-shrink-0"
          />
          <span className="text-sm text-navy-500 leading-relaxed">
            I consent to being contacted by {FIRM_NAME} regarding financial advisory
            services. I understand my information will be processed in accordance with
            the firm's Privacy Policy and will be kept strictly confidential.
          </span>
        </label>
        {errors.consentGiven && <p className="mt-2 text-sm text-red-500">{errors.consentGiven}</p>}
      </div>

      {/* Summary Preview */}
      <div className="bg-surface-light border border-navy-100 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-navy-700 mb-3">Review your submission</h3>
        <p className="text-xs text-navy-400 mb-4">
          Please verify the details below before submitting. You can go back to any step to make changes.
        </p>
        <div className="space-y-3 text-sm">
          <SummaryRow label="Name" value={formData.fullName} />
          <SummaryRow label="Email" value={formData.email} />
          <SummaryRow label="Phone" value={formData.phone} />
          <SummaryRow label="Province" value={formData.province} />
          <SummaryRow label="Assets" value={formatAssets(formData.investableAssets)} />
          <SummaryRow label="Goals" value={formData.financialGoals.join(', ')} />
          <SummaryRow label="Risk" value={capitalize(formData.riskTolerance)} />
          <SummaryRow label="Preferred" value={`${formData.preferredDate} at ${formatTime(formData.preferredTime)}`} />
          {formData.backupDate && (
            <SummaryRow label="Backup" value={`${formData.backupDate} at ${formatTime(formData.backupTime)}`} />
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  if (!value || value === 'at ') return null
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-navy-100/50 last:border-0">
      <span className="text-navy-400 font-medium text-xs uppercase tracking-wider">{label}</span>
      <span className="text-navy-700 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function formatAssets(value) {
  const map = {
    under_25k: 'Under $25,000',
    '25k_100k': '$25,000 - $100,000',
    '100k_250k': '$100,000 - $250,000',
    '250k_500k': '$250,000 - $500,000',
    '500k_1m': '$500,000 - $1,000,000',
    '1m_plus': '$1,000,000+',
  }
  return map[value] || value
}

function formatTime(value) {
  if (!value) return ''
  const [h, m] = value.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function capitalize(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
