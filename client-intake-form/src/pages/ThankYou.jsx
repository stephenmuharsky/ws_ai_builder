export default function ThankYou({ name }) {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-20">
      <div className="max-w-lg mx-auto px-6 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-semibold text-navy-700 mb-4">
          Thank you, {name}.
        </h1>

        <p className="text-navy-400 text-lg leading-relaxed mb-8">
          We have received your information and will be in touch within
          <span className="font-semibold text-navy-600"> 1 business day</span>.
          If your preferred time is available, we will confirm your consultation right away.
        </p>

        <div className="card p-6 text-left mb-8">
          <h3 className="font-body text-sm font-semibold text-navy-500 tracking-wide uppercase mb-4">
            What happens next
          </h3>
          <div className="space-y-4">
            {[
              { step: '1', text: 'Our team reviews your financial profile and matches you with the right advisor.' },
              { step: '2', text: 'You will receive a confirmation email with your consultation details.' },
              { step: '3', text: 'Your advisor prepares personalized insights based on your goals before your meeting.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 bg-navy-700 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{item.step}</span>
                </div>
                <p className="text-sm text-navy-500 leading-relaxed pt-0.5">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-navy-400">
          <p>
            Questions in the meantime? Contact us at{' '}
            <a href="mailto:hello@northstarwealth.ca" className="text-accent-green hover:underline font-medium">
              hello@northstarwealth.ca
            </a>{' '}
            or call{' '}
            <a href="tel:+14165550190" className="text-accent-green hover:underline font-medium">
              +1 (416) 555-0190
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
