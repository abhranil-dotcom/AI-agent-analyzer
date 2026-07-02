import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Upload & Extract' },
  { number: 2, label: 'AI Analysis' },
]

export default function Stepper({ currentStep }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {STEPS.map((step, i) => {
        const done = step.number < currentStep
        const active = step.number === currentStep

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors
                  ${
                    done
                      ? 'border-transparent bg-gradient-to-br from-brand-600 to-accent-500 text-white'
                      : active
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                        : 'border-slate-300 bg-transparent text-slate-400 dark:border-slate-600 dark:text-slate-500'
                  }`}
              >
                {done ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={`text-[11px] font-semibold whitespace-nowrap ${
                  active || done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 mb-5 h-0.5 w-12 rounded-full sm:w-20 ${
                  done ? 'bg-gradient-to-r from-brand-600 to-accent-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
