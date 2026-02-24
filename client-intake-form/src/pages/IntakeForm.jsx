import { useState } from 'react'
import PersonalInfo from '../components/PersonalInfo'
import FinancialProfile from '../components/FinancialProfile'
import InvestmentPreferences from '../components/InvestmentPreferences'
import ConsultationScheduling from '../components/ConsultationScheduling'
import AdditionalContext from '../components/AdditionalContext'
import FormProgress from '../components/FormProgress'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:5678/webhook/intake-form'

const STEPS = [
  { id: 1, title: 'Personal Information', shortTitle: 'Personal' },
  { id: 2, title: 'Financial Profile', shortTitle: 'Financial' },
  { id: 3, title: 'Investment Preferences', shortTitle: 'Preferences' },
  { id: 4, title: 'Consultation Scheduling', shortTitle: 'Scheduling' },
  { id: 5, title: 'Additional Details', shortTitle: 'Details' },
]

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  province: '',
  investableAssets: '',
  annualIncome: '',
  financialGoals: [],
  investmentTimeline: '',
  riskTolerance: '',
  currentAdvisorSituation: '',
  preferredDate: '',
  preferredTime: '',
  backupDate: '',
  backupTime: '',
  freeText: '',
  consentGiven: false,
}

export default function IntakeForm({ onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email'
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      else if (formData.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Please enter a valid phone number'
      if (!formData.province) newErrors.province = 'Province is required'
    }

    if (step === 2) {
      if (!formData.investableAssets) newErrors.investableAssets = 'Please select your investable assets range'
      if (!formData.annualIncome) newErrors.annualIncome = 'Please select your income range'
      if (formData.financialGoals.length === 0) newErrors.financialGoals = 'Please select at least one financial goal'
    }

    if (step === 3) {
      if (!formData.investmentTimeline) newErrors.investmentTimeline = 'Please select your investment timeline'
      if (!formData.riskTolerance) newErrors.riskTolerance = 'Please select your risk tolerance'
      if (!formData.currentAdvisorSituation) newErrors.currentAdvisorSituation = 'Please select your current advisor situation'
    }

    if (step === 4) {
      if (!formData.preferredDate) newErrors.preferredDate = 'Please select a preferred date'
      else {
        const d = new Date(formData.preferredDate + 'T12:00:00')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (d <= today) newErrors.preferredDate = 'Date must be in the future'
        const day = d.getDay()
        if (day === 0 || day === 6) newErrors.preferredDate = 'Please select a weekday'
      }
      if (!formData.preferredTime) newErrors.preferredTime = 'Please select a preferred time'
      if (formData.backupDate) {
        const bd = new Date(formData.backupDate + 'T12:00:00')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (bd <= today) newErrors.backupDate = 'Date must be in the future'
        const day = bd.getDay()
        if (day === 0 || day === 6) newErrors.backupDate = 'Please select a weekday'
      }
    }

    if (step === 5) {
      if (!formData.consentGiven) newErrors.consentGiven = 'You must consent to be contacted'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!validateStep(5)) return
    setSubmitting(true)
    setSubmitError('')

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/\D/g, ''),
      province: formData.province,
      investableAssets: formData.investableAssets,
      annualIncome: formData.annualIncome,
      financialGoals: formData.financialGoals,
      investmentTimeline: formData.investmentTimeline,
      riskTolerance: formData.riskTolerance,
      currentAdvisorSituation: formData.currentAdvisorSituation,
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      backupDate: formData.backupDate || undefined,
      backupTime: formData.backupTime || undefined,
      freeText: formData.freeText.trim() || undefined,
      consentGiven: true,
    }

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.errors?.join(', ') || `Submission failed (${res.status})`)
      }

      onSuccess(formData.fullName.split(' ')[0])
    } catch (err) {
      setSubmitError(
        err.message === 'Failed to fetch'
          ? 'Unable to reach our servers. Please check your connection and try again.'
          : err.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    const props = { formData, updateField, errors }
    switch (currentStep) {
      case 1: return <PersonalInfo {...props} />
      case 2: return <FinancialProfile {...props} />
      case 3: return <InvestmentPreferences {...props} />
      case 4: return <ConsultationScheduling {...props} />
      case 5: return <AdditionalContext {...props} />
      default: return null
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-navy-700 grain overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 opacity-90" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04]">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="300" cy="150" r="200" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="300" cy="150" r="150" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="300" cy="150" r="100" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-accent-green font-body text-sm font-semibold tracking-widest uppercase mb-4 animate-fade-in">
              Complimentary Consultation
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] font-semibold text-white leading-[1.1] mb-6 animate-fade-in-up text-balance">
              Your wealth deserves a strategy as unique as you are.
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Complete this brief questionnaire and one of our advisors will reach out
              within one business day to schedule your personalized consultation.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-surface-light border-b border-navy-100/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs text-navy-400 font-medium tracking-wide">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              256-BIT ENCRYPTION
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              RESPONSE WITHIN 1 BUSINESS DAY
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              REGISTERED PORTFOLIO MANAGERS
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              NO OBLIGATION
            </span>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-6">
          <FormProgress steps={STEPS} currentStep={currentStep} />

          <div className="mt-10">
            <div className="mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-navy-700">
                {STEPS[currentStep - 1].title}
              </h2>
              <div className="mt-2 h-[3px] w-12 bg-accent-green rounded-full" />
            </div>

            <div key={currentStep} className="animate-fade-in-up">
              {renderStep()}
            </div>

            {submitError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button onClick={handleBack} className="btn-secondary" type="button">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  Back
                </button>
              ) : <div />}

              {currentStep < 5 ? (
                <button onClick={handleNext} className="btn-primary" type="button">
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary"
                  type="button"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why NorthStar Section */}
      <section className="bg-surface-light py-16 md:py-20 border-t border-navy-100/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy-700 mb-3">
              Why clients choose NorthStar
            </h2>
            <p className="text-navy-400 max-w-lg mx-auto">
              We combine deep expertise with personalized attention to help you navigate your financial future with confidence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Personalized Strategy',
                desc: 'Every financial plan is built around your unique goals, timeline, and risk profile. No cookie-cutter portfolios.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                ),
              },
              {
                title: 'Tax-Efficient Growth',
                desc: 'Strategic asset location, tax-loss harvesting, and registered account optimization to keep more of what you earn.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                ),
              },
              {
                title: 'Transparent Fees',
                desc: 'Flat-fee or asset-based pricing with no hidden commissions. You always know exactly what you are paying for.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="card p-8 hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center text-accent-green mb-5">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-navy-700 mb-2">{item.title}</h3>
                <p className="text-sm text-navy-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-navy-700 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="font-display text-2xl md:text-3xl font-semibold text-white mb-3">
            Questions before you begin?
          </h3>
          <p className="text-white/50 mb-6">
            Our team is available Monday through Friday, 9 AM to 5 PM EST.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`tel:${import.meta.env.VITE_FIRM_PHONE || '+1 (416) 555-0190'}`}
              className="btn-primary bg-white text-navy-700 hover:bg-white/90 hover:shadow-white/25"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              Call Us
            </a>
            <a
              href={`mailto:${import.meta.env.VITE_FIRM_EMAIL || 'hello@northstarwealth.ca'}`}
              className="btn-secondary border-white/20 text-white hover:bg-white/10 hover:border-white/30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              Send an Email
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
