import { useState } from 'react'
import { FileText, Hash, Layers, Copy, Check } from 'lucide-react'

export default function ExtractedText({ result }) {
  const [copied, setCopied] = useState(false)

  if (!result) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.extracted_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Extracted Resume Text</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Raw text pulled from the PDF using PyPDF.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/60 bg-white/60 px-3 py-1.5 text-xs font-semibold text-slate-600 backdrop-blur-sm transition-all hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.1]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy text
            </>
          )}
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetaCard icon={FileText} label="File" value={result.filename} />
        <MetaCard icon={Layers} label="Pages" value={result.page_count} />
        <MetaCard icon={Hash} label="Characters" value={result.character_count.toLocaleString()} />
      </div>

      <div className="scrollbar-thin max-h-[28rem] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-5 font-mono text-[13px] leading-relaxed text-slate-700 dark:border-slate-700/50 dark:bg-slate-950/80 dark:text-slate-300">
        {result.extracted_text}
      </div>
    </section>
  )
}

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/50 bg-slate-100 px-4 py-3 dark:border-white/[0.06] dark:bg-slate-800/60">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/80 text-brand-600 shadow-sm dark:bg-white/[0.06] dark:text-brand-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  )
}
