import { AlertTriangle, Keyboard, Mic, Video } from 'lucide-react'
import { isSpeechRecognitionSupported } from '../hooks/useSpeechRecognition.js'
import { INTERVIEW_MODES } from '../constants/interview.js'

const MODE_ICONS = { text: Keyboard, voice: Mic, video: Video }

const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
const isCameraSupported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

const MODE_SUPPORT = {
  text: true,
  voice: isSpeechRecognitionSupported && isSpeechSynthesisSupported,
  video: isSpeechRecognitionSupported && isSpeechSynthesisSupported && isCameraSupported,
}

export default function InterviewModeSelect({ onSelect }) {
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <h2 className="mb-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Choose your interview mode
      </h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Same questions either way — just pick how you'd like to answer them.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {INTERVIEW_MODES.map((mode) => {
          const Icon = MODE_ICONS[mode.id]
          const supported = MODE_SUPPORT[mode.id]
          return (
            <button
              key={mode.id}
              type="button"
              disabled={!supported}
              onClick={() => onSelect(mode.id)}
              className={`flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors ${
                supported
                  ? 'border-slate-200/70 hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700/40 dark:hover:border-brand-500/60 dark:hover:bg-brand-950/20'
                  : 'cursor-not-allowed border-slate-200/50 opacity-50 dark:border-slate-700/30'
              }`}
            >
              <Icon className="h-6 w-6 shrink-0 text-brand-600 dark:text-brand-400" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{mode.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{mode.description}</p>
              </div>
              {!supported && (
                <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Not supported in this browser — try Chrome or Edge
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
