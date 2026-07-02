import { useNavigate } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
        <FileQuestion className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to upload
      </button>
    </div>
  )
}
