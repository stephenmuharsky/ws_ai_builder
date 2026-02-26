export default function FormProgress({ steps, currentStep }) {
  return (
    <div className="relative">
      {/* Desktop progress */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, i) => {
          const isActive = step.id === currentStep
          const isComplete = step.id < currentStep
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300
                    ${isComplete
                      ? 'bg-accent-green text-white'
                      : isActive
                        ? 'bg-navy-700 text-white ring-4 ring-navy-700/10'
                        : 'bg-navy-100 text-navy-400'
                    }
                  `}
                >
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isActive ? 'text-navy-700' : isComplete ? 'text-accent-green-dark' : 'text-navy-300'}
                  `}
                >
                  {step.shortTitle}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 mx-3 mt-[-20px]">
                  <div className="h-[2px] bg-navy-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-green transition-all duration-500 rounded-full"
                      style={{ width: isComplete ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-navy-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-navy-400">
            {steps[currentStep - 1].title}
          </span>
        </div>
        <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-green rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
