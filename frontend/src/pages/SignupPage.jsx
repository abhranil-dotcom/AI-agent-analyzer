import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const passwordTooShort = password.length > 0 && password.length < 8

  async function handleSubmit(e) {
    e.preventDefault()
    if (isLoading || passwordTooShort) return
    setIsLoading(true)
    setError(null)
    try {
      await signup(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-10 text-center">
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          Create your account
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Sign up to start analyzing your resume.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80"
      >
        <div>
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>
        </div>

        {(error || passwordTooShort) && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error ?? 'Password must be at least 8 characters.'}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Sign up
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </div>
  )
}
