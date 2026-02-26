const PROVINCES = [
  { value: 'ON', label: 'Ontario' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'QC', label: 'Quebec' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'YT', label: 'Yukon' },
  { value: 'NU', label: 'Nunavut' },
]

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
}

export default function PersonalInfo({ formData, updateField, errors }) {
  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="input-label">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          id="fullName"
          type="text"
          placeholder="e.g. Sarah Chen"
          value={formData.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          className={`input-field ${errors.fullName ? 'error' : ''}`}
          autoComplete="name"
        />
        {errors.fullName && <p className="mt-1.5 text-sm text-red-500">{errors.fullName}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="input-label">
          Email Address <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          type="email"
          placeholder="sarah@example.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={`input-field ${errors.email ? 'error' : ''}`}
          autoComplete="email"
        />
        {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="input-label">
          Phone Number <span className="text-red-400">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="(416) 555-1234"
          value={formData.phone}
          onChange={(e) => updateField('phone', formatPhone(e.target.value))}
          className={`input-field ${errors.phone ? 'error' : ''}`}
          autoComplete="tel"
        />
        {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone}</p>}
      </div>

      {/* Province */}
      <div>
        <label htmlFor="province" className="input-label">
          Province / Territory of Residence <span className="text-red-400">*</span>
        </label>
        <select
          id="province"
          value={formData.province}
          onChange={(e) => updateField('province', e.target.value)}
          className={`input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238490ab%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${errors.province ? 'error' : ''} ${!formData.province ? 'text-navy-300' : ''}`}
        >
          <option value="">Select your province</option>
          {PROVINCES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        {errors.province && <p className="mt-1.5 text-sm text-red-500">{errors.province}</p>}
      </div>
    </div>
  )
}
