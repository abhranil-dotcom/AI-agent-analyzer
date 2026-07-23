import { FileSearch, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme.js'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

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

        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          )}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </div>
    </header>
  )
}
