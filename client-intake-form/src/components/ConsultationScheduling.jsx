const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
]

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getMaxDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

export default function ConsultationScheduling({ formData, updateField, errors }) {
  const minDate = getMinDate()
  const maxDate = getMaxDate()

  return (
    <div className="space-y-8">
      <div className="bg-navy-50/50 border border-navy-100 rounded-lg p-4 text-sm text-navy-500">
        <p className="font-medium text-navy-600 mb-1">About your consultation</p>
        <p className="text-navy-400 leading-relaxed">
          Initial consultations are 60 minutes and conducted via video call. Available
          Monday through Friday, 9:00 AM to 5:00 PM EST. Select your preferred time
          below and we will confirm availability.
        </p>
      </div>

      {/* Preferred Date & Time */}
      <div>
        <h3 className="text-sm font-semibold text-navy-700 mb-4">
          Preferred Date & Time <span className="text-red-400">*</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="preferredDate" className="input-label text-xs">Date</label>
            <input
              id="preferredDate"
              type="date"
              min={minDate}
              max={maxDate}
              value={formData.preferredDate}
              onChange={(e) => updateField('preferredDate', e.target.value)}
              className={`input-field ${errors.preferredDate ? 'error' : ''}`}
            />
            {errors.preferredDate && <p className="mt-1.5 text-sm text-red-500">{errors.preferredDate}</p>}
          </div>
          <div>
            <label htmlFor="preferredTime" className="input-label text-xs">Time (EST)</label>
            <select
              id="preferredTime"
              value={formData.preferredTime}
              onChange={(e) => updateField('preferredTime', e.target.value)}
              className={`input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238490ab%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${errors.preferredTime ? 'error' : ''} ${!formData.preferredTime ? 'text-navy-300' : ''}`}
            >
              <option value="">Select a time</option>
              {TIME_SLOTS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.preferredTime && <p className="mt-1.5 text-sm text-red-500">{errors.preferredTime}</p>}
          </div>
        </div>
      </div>

      {/* Backup Date & Time */}
      <div>
        <h3 className="text-sm font-semibold text-navy-700 mb-1">
          Backup Date & Time
        </h3>
        <p className="text-xs text-navy-400 mb-4">
          Optional. Providing a backup helps us schedule faster if your first choice is unavailable.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="backupDate" className="input-label text-xs">Date</label>
            <input
              id="backupDate"
              type="date"
              min={minDate}
              max={maxDate}
              value={formData.backupDate}
              onChange={(e) => updateField('backupDate', e.target.value)}
              className={`input-field ${errors.backupDate ? 'error' : ''}`}
            />
            {errors.backupDate && <p className="mt-1.5 text-sm text-red-500">{errors.backupDate}</p>}
          </div>
          <div>
            <label htmlFor="backupTime" className="input-label text-xs">Time (EST)</label>
            <select
              id="backupTime"
              value={formData.backupTime}
              onChange={(e) => updateField('backupTime', e.target.value)}
              className={`input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238490ab%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${!formData.backupTime ? 'text-navy-300' : ''}`}
            >
              <option value="">Select a time</option>
              {TIME_SLOTS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
