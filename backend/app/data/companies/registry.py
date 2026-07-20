"""Static roster of companies supported for recommendation and RAG interview prep.

Content is deliberately fixed to this set because each company needs a seeded
knowledge base (see the sibling `<slug>/` directories) for retrieval to work —
the recommender agent is constrained to choose from this list so every
recommendation is guaranteed to have a working "Prepare" flow behind it.
"""

from pydantic import BaseModel


class CompanyInfo(BaseModel):
    slug: str
    display_name: str
    blurb: str


COMPANY_REGISTRY: list[CompanyInfo] = [
    CompanyInfo(
        slug="tcs",
        display_name="Tata Consultancy Services (TCS)",
        blurb=(
            "India's largest IT services company; mass campus hiring via TCS NQT, generalist "
            "entry-level roles spanning Java, mainframe, and digital stacks, moderate technical "
            "bar with heavy weight on aptitude, communication, and trainability."
        ),
    ),
    CompanyInfo(
        slug="infosys",
        display_name="Infosys",
        blurb=(
            "Major Indian IT services firm known for its Mysore training campus and InfyTQ "
            "certification pipeline; broad entry-level hiring across Java/Python/digital, "
            "moderate technical bar, strong focus on foundational programming and learnability."
        ),
    ),
    CompanyInfo(
        slug="capgemini",
        display_name="Capgemini",
        blurb=(
            "French-origin global IT consulting and digital transformation firm; strong presence "
            "in cloud, SAP, and enterprise application services, moderate technical bar with "
            "emphasis on client-facing communication and adaptability across tech stacks."
        ),
    ),
    CompanyInfo(
        slug="accenture",
        display_name="Accenture",
        blurb=(
            "Global technology consulting and professional services leader; heavy focus on cloud, "
            "SAP, data & AI, and enterprise transformation projects, moderate-to-high bar for "
            "lateral hires, values versatility across business and technology domains."
        ),
    ),
    CompanyInfo(
        slug="cognizant",
        display_name="Cognizant",
        blurb=(
            "IT services and consulting company strong in healthcare, BFSI, and retail verticals; "
            "GenC program for freshers, moderate technical bar with emphasis on domain adaptability "
            "and full-stack/digital engineering skills."
        ),
    ),
    CompanyInfo(
        slug="amazon",
        display_name="Amazon",
        blurb=(
            "Big tech e-commerce and cloud (AWS) company; interviews are built around the Leadership "
            "Principles with a dedicated bar-raiser round, high technical bar with medium-to-hard "
            "data structures & algorithms, strong emphasis on ownership and scalable system design."
        ),
    ),
    CompanyInfo(
        slug="google",
        display_name="Google",
        blurb=(
            "Big tech company with an intense focus on core CS fundamentals — algorithms, data "
            "structures, and complexity analysis at a medium-to-hard bar — plus 'Googleyness' "
            "culture-fit assessment; less weight on any single specific tech stack."
        ),
    ),
    CompanyInfo(
        slug="microsoft",
        display_name="Microsoft",
        blurb=(
            "Big tech company spanning cloud (Azure), productivity, and developer tools; strong CS "
            "fundamentals and DSA bar at medium-to-hard difficulty, system design weighted more for "
            "senior roles, culture emphasis on a 'growth mindset' and collaboration."
        ),
    ),
]

_BY_SLUG = {c.slug: c for c in COMPANY_REGISTRY}


def get_company(slug: str) -> CompanyInfo | None:
    return _BY_SLUG.get(slug)
