export default function Footer() {
  const stack = ['React', 'Vite', 'FastAPI', 'PyPDF']

  return (
    <footer className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col items-center gap-3 border-t border-slate-200 pt-6 text-center dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {stack.map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          LangChain, LangGraph &amp; Azure OpenAI integration coming in a future milestone
        </p>
      </div>
    </footer>
  )
}
