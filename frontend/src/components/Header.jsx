import { FileSearch } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.js'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#080b14]/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-lg shadow-brand-500/20 dark:shadow-brand-500/10">
            <FileSearch className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
              AI Resume Analyzer
            </p>
          </div>
        </div>

        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
    </header>
  )
}
