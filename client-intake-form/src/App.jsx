import { useState } from 'react'
import IntakeForm from './pages/IntakeForm'
import ThankYou from './pages/ThankYou'

const FIRM_NAME = import.meta.env.VITE_FIRM_NAME || 'NorthStar Wealth Advisory'
const FIRM_PHONE = import.meta.env.VITE_FIRM_PHONE || '+1 (416) 555-0190'
const FIRM_EMAIL = import.meta.env.VITE_FIRM_EMAIL || 'hello@northstarwealth.ca'

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-navy-100/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent-green" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold text-navy-700 tracking-tight">{FIRM_NAME}</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-navy-500">
          <a href={`tel:${FIRM_PHONE}`} className="hover:text-navy-700 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {FIRM_PHONE}
          </a>
          <a href={`mailto:${FIRM_EMAIL}`} className="hover:text-navy-700 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            {FIRM_EMAIL}
          </a>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-navy-700 text-white/70">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent-green" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </div>
              <span className="font-display text-lg font-semibold text-white">{FIRM_NAME}</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              Personalized financial guidance for Canadians building lasting wealth.
              Registered with provincial securities regulators.
            </p>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold text-white mb-4 tracking-wide uppercase">Contact</h4>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                {FIRM_PHONE}
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                {FIRM_EMAIL}
              </p>
              <p className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                100 King Street West, Suite 5700<br />Toronto, ON M5X 1C7
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold text-white mb-4 tracking-wide uppercase">Hours</h4>
            <div className="space-y-2 text-sm">
              <p>Monday - Friday: 9:00 AM - 5:00 PM EST</p>
              <p>Saturday - Sunday: Closed</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-white/40 leading-relaxed">
                NorthStar Wealth Advisory is a registered portfolio manager.
                Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} {FIRM_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  const handleSuccess = (name) => {
    setSubmittedName(name)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {submitted ? (
          <ThankYou name={submittedName} />
        ) : (
          <IntakeForm onSuccess={handleSuccess} />
        )}
      </main>
      <Footer />
    </div>
  )
}
