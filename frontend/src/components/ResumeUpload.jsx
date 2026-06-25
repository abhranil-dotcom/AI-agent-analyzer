import { useRef, useState } from 'react'
import { UploadCloud, FileText, X, Loader2, ArrowRight } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResumeUpload({ onUpload, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleRemove(e) {
    e.stopPropagation()
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleSubmit() {
    if (selectedFile) onUpload(selectedFile)
  }

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Upload your resume</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          PDF only, up to 10 MB. Processed entirely within this app.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragActive(true)
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300
          ${!selectedFile && !isDragActive ? 'upload-zone-idle' : ''}
          ${isDragActive
            ? 'scale-[1.01] border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/20'
            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-brand-500 dark:hover:bg-brand-950/30'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {!selectedFile ? (
          <>
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 transition-transform duration-300 group-hover:scale-110 dark:text-brand-400">
              <UploadCloud className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drag &amp; drop your resume, or{' '}
              <span className="text-brand-600 dark:text-brand-400">browse files</span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">PDF documents only</p>
          </>
        ) : (
          <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:bg-gradient-to-r disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting text…
            </>
          ) : (
            <>
              Upload &amp; Extract Text
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        {selectedFile && !isLoading && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ready to upload</span>
        )}
      </div>
    </section>
  )
}
