"""
Single source of truth for learning-platform facts: display names, LLM-facing specialty
descriptions, and real resource URLs/titles/durations. The LLM never invents a URL, specific
course title, or duration — it only picks which platforms are relevant per skill (see
LEARNING_RESOURCES_SYSTEM_PROMPT); everything factual here is resolved deterministically by
resolve_resource().

Where a specific, verified real resource exists for a skill (the CURATED_* dicts below), that's
used. Otherwise resolve_resource() falls back to that platform's real search/browse/catalog page
— honestly labeled (e.g. "Explore X on Y"), never a fabricated specific listing.
"""

from dataclasses import dataclass
from typing import Literal
from urllib.parse import quote

LearningPlatformKey = Literal[
    "udemy",
    "coursera",
    "edx",
    "freecodecamp",
    "youtube",
    "microsoft_learn",
    "aws_skill_builder",
    "google_cloud_skills_boost",
    "oracle_university",
    "cisco_networking_academy",
    "kaggle_learn",
    "codecademy",
    "geeksforgeeks",
    "leetcode",
    "hackerrank",
]

PLATFORM_DISPLAY_NAMES: dict[str, str] = {
    "udemy": "Udemy",
    "coursera": "Coursera",
    "edx": "edX",
    "freecodecamp": "freeCodeCamp",
    "youtube": "YouTube",
    "microsoft_learn": "Microsoft Learn",
    "aws_skill_builder": "AWS Skill Builder",
    "google_cloud_skills_boost": "Google Cloud Skills Boost",
    "oracle_university": "Oracle University",
    "cisco_networking_academy": "Cisco Networking Academy",
    "kaggle_learn": "Kaggle Learn",
    "codecademy": "Codecademy",
    "geeksforgeeks": "GeeksforGeeks",
    "leetcode": "LeetCode",
    "hackerrank": "HackerRank",
}

# Fed into the LLM prompt so it can judge, per missing skill, which platforms are actually
# relevant — never all 15 for every skill.
PLATFORM_DESCRIPTIONS: dict[str, str] = {
    "udemy": "Broad paid course marketplace covering almost any technical skill",
    "coursera": "University- and industry-partnered courses/specializations (e.g. DeepLearning.AI, Google, IBM) — strong for AI/data, cloud, and structured career certificates",
    "edx": "University-backed courses, strong for computer science fundamentals and academic-style subjects",
    "freecodecamp": "Free, project-based web/programming curriculum and articles — strong for web dev and general programming fundamentals",
    "youtube": "Free video tutorials and crash courses on virtually any technical topic",
    "microsoft_learn": "Official Microsoft documentation-style learning paths — strong for Azure, .NET, and Microsoft-stack skills",
    "aws_skill_builder": "Official AWS training platform — only relevant for AWS/cloud skills",
    "google_cloud_skills_boost": "Official Google Cloud training platform — only relevant for GCP/cloud skills",
    "oracle_university": "Official Java/Oracle certification paths — only relevant for Java or Oracle-stack skills",
    "cisco_networking_academy": "Official Cisco training — only relevant for networking or cybersecurity skills",
    "kaggle_learn": "Free, hands-on micro-courses — strong for Python, ML, deep learning, data science, and SQL",
    "codecademy": "Interactive, hands-on coding lessons — strong for programming language fundamentals",
    "geeksforgeeks": "Free reference articles and tutorials — strong for CS fundamentals, DSA, and language-specific topics",
    "leetcode": "Coding practice problems organized by topic — strong for algorithms/DSA and interview prep, not for cloud/tooling skills",
    "hackerrank": "Coding practice problems and skill certifications across languages and CS fundamentals",
}


@dataclass(frozen=True)
class ResolvedResource:
    platform_name: str
    title: str
    resource_url: str
    estimated_duration: str | None
    is_curated: bool


@dataclass(frozen=True)
class _CuratedEntry:
    slug: str
    title: str
    duration: str | None = None


def _normalize(skill: str) -> str:
    return " ".join(skill.strip().lower().split())


# Verified stable Kaggle Learn micro-course slugs (kaggle.com/learn/<slug>).
KAGGLE_LEARN_COURSES: dict[str, _CuratedEntry] = {
    "python": _CuratedEntry("python", "Python", "~5 hours"),
    "machine learning": _CuratedEntry("intro-to-machine-learning", "Intro to Machine Learning", "~3 hours"),
    "ml": _CuratedEntry("intro-to-machine-learning", "Intro to Machine Learning", "~3 hours"),
    "intermediate machine learning": _CuratedEntry("intermediate-machine-learning", "Intermediate Machine Learning", "~4 hours"),
    "deep learning": _CuratedEntry("intro-to-deep-learning", "Intro to Deep Learning", "~4 hours"),
    "computer vision": _CuratedEntry("computer-vision", "Computer Vision", "~4 hours"),
    "natural language processing": _CuratedEntry("natural-language-processing", "Natural Language Processing", "~4 hours"),
    "nlp": _CuratedEntry("natural-language-processing", "Natural Language Processing", "~4 hours"),
    "data visualization": _CuratedEntry("data-visualization", "Data Visualization", "~4 hours"),
    "sql": _CuratedEntry("intro-to-sql", "Intro to SQL", "~3 hours"),
    "advanced sql": _CuratedEntry("advanced-sql", "Advanced SQL", "~3 hours"),
    "feature engineering": _CuratedEntry("feature-engineering", "Feature Engineering", "~5 hours"),
    "pandas": _CuratedEntry("pandas", "Pandas", "~4 hours"),
    "data cleaning": _CuratedEntry("data-cleaning", "Data Cleaning", "~4 hours"),
    "time series": _CuratedEntry("time-series", "Time Series", "~4 hours"),
    "geospatial analysis": _CuratedEntry("geospatial-analysis", "Geospatial Analysis", "~4 hours"),
}

# Verified real geeksforgeeks.org/category/<slug>/ pattern (confirmed for python, java).
GEEKSFORGEEKS_CATEGORIES: dict[str, _CuratedEntry] = {
    "python": _CuratedEntry("python", "Python"),
    "java": _CuratedEntry("java", "Java"),
    "javascript": _CuratedEntry("javascript", "JavaScript"),
    "sql": _CuratedEntry("sql", "SQL"),
    "data structures": _CuratedEntry("dsa", "Data Structures & Algorithms"),
    "algorithms": _CuratedEntry("dsa", "Data Structures & Algorithms"),
    "dsa": _CuratedEntry("dsa", "Data Structures & Algorithms"),
    "machine learning": _CuratedEntry("machine-learning", "Machine Learning"),
    "system design": _CuratedEntry("system-design", "System Design"),
    "c": _CuratedEntry("c", "C"),
    "c++": _CuratedEntry("cpp", "C++"),
}

# Well-established, long-stable leetcode.com/tag/<slug>/ topic pages. Deliberately excludes
# language names (Java/Python) — LeetCode tags are algorithmic topics, not languages.
LEETCODE_TAGS: dict[str, _CuratedEntry] = {
    "dynamic programming": _CuratedEntry("dynamic-programming", "Dynamic Programming"),
    "arrays": _CuratedEntry("array", "Array"),
    "graphs": _CuratedEntry("graph", "Graph"),
    "greedy": _CuratedEntry("greedy", "Greedy"),
    "backtracking": _CuratedEntry("backtracking", "Backtracking"),
    "hash table": _CuratedEntry("hash-table", "Hash Table"),
    "two pointers": _CuratedEntry("two-pointers", "Two Pointers"),
    "sliding window": _CuratedEntry("sliding-window", "Sliding Window"),
    "binary search": _CuratedEntry("binary-search", "Binary Search"),
    "sorting": _CuratedEntry("sorting", "Sorting"),
    "recursion": _CuratedEntry("recursion", "Recursion"),
    "stack": _CuratedEntry("stack", "Stack"),
    "linked list": _CuratedEntry("linked-list", "Linked List"),
    "data structures": _CuratedEntry("data-structures", "Data Structures"),
    "algorithms": _CuratedEntry("algorithms", "Algorithms"),
    "sql": _CuratedEntry("database", "Database"),
}

# Confirmed real edx.org/learn/<slug> subject landing pages.
EDX_SUBJECTS: dict[str, _CuratedEntry] = {
    "python": _CuratedEntry("python", "Python"),
    "javascript": _CuratedEntry("javascript", "JavaScript"),
    "java": _CuratedEntry("java", "Java"),
    "data science": _CuratedEntry("data-science", "Data Science"),
    "computer science": _CuratedEntry("computer-science", "Computer Science"),
    "cybersecurity": _CuratedEntry("cybersecurity", "Cybersecurity"),
    "cloud computing": _CuratedEntry("cloud-computing", "Cloud Computing"),
    "artificial intelligence": _CuratedEntry("artificial-intelligence", "Artificial Intelligence"),
    "ai": _CuratedEntry("artificial-intelligence", "Artificial Intelligence"),
    "machine learning": _CuratedEntry("machine-learning", "Machine Learning"),
}

# Search/browse URL builders for platforms without (or outside) a curated match. Every entry
# here is a real, functional endpoint — never a guessed deep link to a specific listing.
_SEARCH_URL_BUILDERS = {
    "udemy": lambda skill: f"https://www.udemy.com/courses/search/?q={quote(skill)}",
    "coursera": lambda skill: f"https://www.coursera.org/search?query={quote(skill)}",
    "edx": lambda skill: f"https://www.edx.org/search?q={quote(skill)}",
    "freecodecamp": lambda skill: f"https://www.freecodecamp.org/news/search/?query={quote(skill)}",
    "youtube": lambda skill: f"https://www.youtube.com/results?search_query={quote(skill + ' tutorial')}",
    "microsoft_learn": lambda skill: f"https://learn.microsoft.com/en-us/search/?terms={quote(skill)}",
    "aws_skill_builder": lambda skill: f"https://skillbuilder.aws/search?searchText={quote(skill)}",
    "codecademy": lambda skill: f"https://www.codecademy.com/search?query={quote(skill)}",
    "geeksforgeeks": lambda skill: f"https://www.geeksforgeeks.org/?s={quote(skill)}",
}

# Platforms whose real entry point is a fixed catalog/browse page rather than a per-skill query
# (their search endpoints aren't confidently verifiable, or the platform is only ever relevant
# for a narrow domain anyway — see PLATFORM_DESCRIPTIONS).
_STATIC_CATALOG_PAGES: dict[str, tuple[str, str]] = {
    "google_cloud_skills_boost": ("https://www.skills.google/catalog", "Browse the Google Cloud Skills Boost catalog"),
    "oracle_university": ("https://education.oracle.com/java", "Oracle Java certifications & learning paths"),
    "cisco_networking_academy": ("https://www.netacad.com/courses/all-courses", "Browse Cisco Networking Academy courses"),
    "hackerrank": ("https://www.hackerrank.com/domains", "Browse HackerRank practice domains"),
    "leetcode": ("https://leetcode.com/problemset/", "Browse LeetCode practice problems"),
    "kaggle_learn": ("https://www.kaggle.com/learn", "Browse the Kaggle Learn course catalog"),
}

_CURATED_REGISTRIES: dict[str, dict[str, _CuratedEntry]] = {
    "kaggle_learn": KAGGLE_LEARN_COURSES,
    "geeksforgeeks": GEEKSFORGEEKS_CATEGORIES,
    "leetcode": LEETCODE_TAGS,
    "edx": EDX_SUBJECTS,
}

_CURATED_URL_TEMPLATES: dict[str, str] = {
    "kaggle_learn": "https://www.kaggle.com/learn/{slug}",
    "geeksforgeeks": "https://www.geeksforgeeks.org/category/{slug}/",
    "leetcode": "https://leetcode.com/tag/{slug}/",
    "edx": "https://www.edx.org/learn/{slug}",
}

_CURATED_TITLE_TEMPLATES: dict[str, str] = {
    "kaggle_learn": "{title}",
    "geeksforgeeks": "{title} Tutorials & Articles",
    "leetcode": "{title} Practice Problems",
    "edx": "{title} on edX",
}


def resolve_resource(platform: str, skill: str) -> ResolvedResource:
    """Deterministically resolves the real title/URL/duration for a (platform, skill) pair.
    Never LLM-driven — see module docstring."""
    normalized = _normalize(skill)
    platform_name = PLATFORM_DISPLAY_NAMES[platform]

    registry = _CURATED_REGISTRIES.get(platform)
    if registry is not None:
        entry = registry.get(normalized)
        if entry is not None:
            url = _CURATED_URL_TEMPLATES[platform].format(slug=entry.slug)
            title = _CURATED_TITLE_TEMPLATES[platform].format(title=entry.title)
            return ResolvedResource(platform_name, title, url, entry.duration, is_curated=True)

    if platform in _STATIC_CATALOG_PAGES:
        url, title = _STATIC_CATALOG_PAGES[platform]
        return ResolvedResource(platform_name, title, url, None, is_curated=False)

    builder = _SEARCH_URL_BUILDERS.get(platform)
    if builder is not None:
        return ResolvedResource(platform_name, f"Explore {skill} on {platform_name}", builder(skill), None, is_curated=False)

    raise ValueError(f"Unknown learning platform key: {platform!r}")
