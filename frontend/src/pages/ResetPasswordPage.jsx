import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, KeyRound, Loader2 } from 'lucide-react'
import { resetPassword } from '../api/client.js'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordTooShort = password.length > 0 && password.length < 8
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  async function handleSubmit(e) {
    e.preventDefault()
    if (isLoading || passwordTooShort || passwordsMismatch) return
    setIsLoading(true)
    setError(null)
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            This reset link is missing its token. Request a new one below.
          </p>
          <Link
            to="/forgot-password"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-10 text-center">
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          Choose a new password
        </h1>
      </div>

      {success ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Your password has been reset.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Log in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80"
        >
          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              New password
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

          <div>
            <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
            />
          </div>

          {(error || passwordTooShort || passwordsMismatch) && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">
                {error ?? (passwordTooShort ? 'Password must be at least 8 characters.' : 'Passwords do not match.')}
              </span>
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
                Resetting…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Reset password
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
