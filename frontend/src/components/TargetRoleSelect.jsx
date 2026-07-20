import { useState } from 'react'
import { Briefcase, ChevronDown } from 'lucide-react'
import { TARGET_ROLES, OTHER_ROLE } from '../constants/roles.js'

export default function TargetRoleSelect({ value, onChange }) {
  const isCustomValue = value !== '' && !TARGET_ROLES.includes(value)
  const [selection, setSelection] = useState(isCustomValue ? OTHER_ROLE : value)
  const [customText, setCustomText] = useState(isCustomValue ? value : '')

  function handleSelectChange(e) {
    const next = e.target.value
    setSelection(next)
    onChange(next === OTHER_ROLE ? customText : next)
  }

  function handleCustomChange(e) {
    const text = e.target.value
    setCustomText(text)
    onChange(text)
  }

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Target role</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Select the role you&rsquo;re applying for. The ATS score and feedback will be tailored to it.
        </p>
      </div>

      <div className="relative">
        <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          value={selection}
          onChange={handleSelectChange}
          aria-label="Target role"
          className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-9 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
        >
          <option value="" disabled>
            Select a role…
          </option>
          {TARGET_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
          <option value={OTHER_ROLE}>Other</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {selection === OTHER_ROLE && (
        <input
          type="text"
          value={customText}
          onChange={handleCustomChange}
          placeholder="Enter the role you're applying for"
          aria-label="Custom target role"
          className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
        />
      )}
    </section>
  )
}
