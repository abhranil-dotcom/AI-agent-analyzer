export const QUESTION_COUNTS = { hr: 5, resume: 5, technical: 5, coding: 5 }

// Warm-up (HR) -> personalized (resume) -> domain depth (technical) -> hardest (coding),
// mirroring the round ordering most of the seeded companies actually use.
export const CATEGORY_ORDER = ['hr', 'resume', 'technical', 'coding']

export const CATEGORY_LABELS = {
  hr: 'HR',
  resume: 'Resume-Based',
  technical: 'Technical',
  coding: 'Coding',
}

const CATEGORY_FIELD = {
  hr: 'hr_questions',
  resume: 'resume_questions',
  technical: 'technical_questions',
  coding: 'coding_questions',
}

export function flattenQuestions(kit) {
  return CATEGORY_ORDER.flatMap((category) => kit[CATEGORY_FIELD[category]] ?? [])
}
