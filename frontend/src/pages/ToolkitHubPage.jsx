import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileSearch2, GraduationCap, Mail, PenLine } from 'lucide-react'
import ToolkitCard from '../components/ToolkitCard.jsx'

export default function ToolkitHubPage({ targetRole, selectedCompany }) {
  const navigate = useNavigate()

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/analysis')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to analysis
      </button>

      <div className="mb-12 text-center">
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          Career toolkit
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Optional tools for {targetRole} — none of these are required to continue with company prep.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ToolkitCard
          icon={FileSearch2}
          title="Resume vs Job Description"
          description="Paste a job posting and see how well your resume matches its specific requirements."
          onClick={() => navigate('/toolkit/match-jd')}
        />
        <ToolkitCard
          icon={PenLine}
          title="Resume Rewrite"
          description="Get stronger, rewritten bullet points, a sharper summary, and cleaned-up skills phrasing."
          onClick={() => navigate('/toolkit/rewrite')}
        />
        <ToolkitCard
          icon={GraduationCap}
          title="Skill Gap & Learning Path"
          description="Turn your missing skills into a prioritized, role-specific learning plan."
          onClick={() => navigate('/toolkit/skill-gap')}
        />
        <ToolkitCard
          icon={Mail}
          title="Cover Letter Generator"
          description="Generate a complete, role-targeted cover letter grounded in your resume."
          hint={selectedCompany ? `Will be personalized for ${selectedCompany.display_name}` : null}
          onClick={() => navigate('/toolkit/cover-letter')}
        />
      </div>
    </>
  )
}
