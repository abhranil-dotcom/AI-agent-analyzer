"""
Single source of truth for learning-platform facts: display names, LLM-facing specialty
descriptions, and real resource URLs/titles/instructors/prices. The LLM never invents a URL,
specific course title, instructor, or price, and never picks which platform to recommend either —
see get_curated_matches(), the recommender agent's only entry point into this module. For a given
missing skill, it returns the single best verified paid resource and the single best verified free
resource (or None on either side when no individually verified match exists) purely from the
CURATED_* dicts below; the LLM's job is limited to writing personalized narrative (difficulty,
why_recommended, what_to_look_for) about resources this module already resolved. A skill with no
curated match on a given side is simply not recommended on that side — never a generic search or
catalog-browse page presented as if it were a specific resource.

resolve_resource() (used internally by get_curated_matches(), and still usable standalone) *can*
fall back to a platform's real search/browse page when nothing is curated — but that fallback path
is deliberately never reached through get_curated_matches(), since a search-results page is not an
individually verified specific resource.
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
    platform: str
    platform_name: str
    title: str
    resource_url: str
    estimated_duration: str | None
    is_curated: bool
    instructor: str | None = None
    # Only meaningful for paid platforms — an honest status label ("Check current price", "Free to
    # Audit", "Subscription"), never a specific invented number, since list prices (Udemy
    # especially) change/discount too often to state a figure as current and correct.
    price_status: str | None = None
    is_free: bool = False


@dataclass(frozen=True)
class _CuratedEntry:
    slug: str | None = None
    title: str = ""
    duration: str | None = None
    # Set instead of `slug` for platforms with no clean per-skill URL template (Udemy, Coursera) —
    # a full, individually verified real course/specialization URL.
    url: str | None = None
    instructor: str | None = None
    price_status: str | None = None


def _normalize(skill: str) -> str:
    return " ".join(skill.strip().lower().split())


# Platforms whose actual learning content is free to access (no paywall on the material itself,
# even where a separate paid certification exam exists) — drives the Learning Resources page's
# Paid/Free section split. Everything else (udemy, coursera, edx, codecademy) is paid/subscription.
FREE_PLATFORMS: frozenset[str] = frozenset(
    {
        "freecodecamp",
        "youtube",
        "microsoft_learn",
        "aws_skill_builder",
        "google_cloud_skills_boost",
        "oracle_university",
        "cisco_networking_academy",
        "kaggle_learn",
        "geeksforgeeks",
        "leetcode",
        "hackerrank",
    }
)

# Honest status label for a NON-curated (search/browse-page) pick on a paid platform — never a
# specific price, since a search link doesn't point at one course. Free platforms need no entry
# here (the frontend shows a FREE badge from `is_free` instead).
_FALLBACK_PRICE_STATUS: dict[str, str] = {
    "udemy": "Check current price",
    "coursera": "Free to audit",
    "edx": "Free to audit",
    "codecademy": "Subscription",
}


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

# Individually researched and verified (title + instructor + URL cross-checked against Udemy's own
# indexed course pages and independent course-aggregator sites — Class Central, OpenCourser — in
# August 2026) real, currently-live Udemy courses. Deliberately NOT an exhaustive skill list — for
# any skill not covered here, resolve_resource() falls back to Udemy's real search results page
# rather than guess at a course that may not exist. price_status is always "Check current price", never a
# specific number: Udemy list/sale prices change too often and by region to state a current figure.
UDEMY_COURSES: dict[str, _CuratedEntry] = {
    "angular": _CuratedEntry(
        title="Angular - The Complete Guide (2024 Edition)",
        url="https://www.udemy.com/course/the-complete-guide-to-angular-2/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "react": _CuratedEntry(
        title="React - The Complete Guide (incl. Next.js, Redux)",
        url="https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "typescript": _CuratedEntry(
        title="Understanding TypeScript",
        url="https://www.udemy.com/course/understanding-typescript/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "rxjs": _CuratedEntry(
        title="RxJs In Practice",
        url="https://www.udemy.com/course/rxjs-course/",
        instructor="Angular University",
        price_status="Check current price",
    ),
    "vue": _CuratedEntry(
        title="Vue - The Complete Guide (incl. Router & Composition API)",
        url="https://www.udemy.com/course/vuejs-2-the-complete-guide/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "vue.js": _CuratedEntry(
        title="Vue - The Complete Guide (incl. Router & Composition API)",
        url="https://www.udemy.com/course/vuejs-2-the-complete-guide/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "node.js": _CuratedEntry(
        title="NodeJS - The Complete Guide (MVC, REST APIs, GraphQL, Deno)",
        url="https://www.udemy.com/course/nodejs-the-complete-guide/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "node": _CuratedEntry(
        title="NodeJS - The Complete Guide (MVC, REST APIs, GraphQL, Deno)",
        url="https://www.udemy.com/course/nodejs-the-complete-guide/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "docker": _CuratedEntry(
        title="Docker & Kubernetes: The Practical Guide",
        url="https://www.udemy.com/course/docker-kubernetes-the-practical-guide/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "kubernetes": _CuratedEntry(
        title="Docker & Kubernetes: The Practical Guide",
        url="https://www.udemy.com/course/docker-kubernetes-the-practical-guide/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "aws": _CuratedEntry(
        title="Ultimate AWS Certified Solutions Architect Associate 2026",
        url="https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/",
        instructor="Stephane Maarek",
        price_status="Check current price",
    ),
    "sql": _CuratedEntry(
        title="The Complete SQL Bootcamp: Go from Zero to Hero",
        url="https://www.udemy.com/course/the-complete-sql-bootcamp/",
        instructor="Jose Portilla",
        price_status="Check current price",
    ),
    "mongodb": _CuratedEntry(
        title="MongoDB - The Complete Developer's Guide",
        url="https://www.udemy.com/course/mongodb-the-complete-developers-guide/",
        instructor="Maximilian Schwarzmüller",
        price_status="Check current price",
    ),
    "spring boot": _CuratedEntry(
        title="Learn Spring Boot 3 in 100 Steps",
        url="https://www.udemy.com/course/spring-boot-tutorial-for-beginners/",
        instructor="Ranga Karanam (in28minutes)",
        price_status="Check current price",
    ),
    "spring": _CuratedEntry(
        title="Learn Spring Boot 3 in 100 Steps",
        url="https://www.udemy.com/course/spring-boot-tutorial-for-beginners/",
        instructor="Ranga Karanam (in28minutes)",
        price_status="Check current price",
    ),
    "python": _CuratedEntry(
        title="100 Days of Code: The Complete Python Pro Bootcamp",
        url="https://www.udemy.com/course/100-days-of-code/",
        instructor="Dr. Angela Yu",
        price_status="Check current price",
    ),
    "system design": _CuratedEntry(
        title="Mastering the System Design Interview",
        url="https://www.udemy.com/course/system-design-interview-prep/",
        instructor="Frank Kane",
        price_status="Check current price",
    ),
    "git": _CuratedEntry(
        title="The Git & GitHub Bootcamp",
        url="https://www.udemy.com/course/git-and-github-bootcamp/",
        instructor="Colt Steele",
        price_status="Check current price",
    ),
    "github": _CuratedEntry(
        title="The Git & GitHub Bootcamp",
        url="https://www.udemy.com/course/git-and-github-bootcamp/",
        instructor="Colt Steele",
        price_status="Check current price",
    ),
    "machine learning": _CuratedEntry(
        title="Machine Learning A-Z: AI, Python & R + ChatGPT Prize",
        url="https://www.udemy.com/course/machinelearning/",
        instructor="Kirill Eremenko, Hadelin de Ponteves",
        price_status="Check current price",
    ),
}

# Same discipline as UDEMY_COURSES — individually verified real Coursera specializations/
# professional certificates. price_status is "Free to audit" for all of them: this is a stable,
# structural fact about how Coursera's audit model works (not a fluctuating price), so it's safe
# to state directly rather than a generic "Check current price".
COURSERA_COURSES: dict[str, _CuratedEntry] = {
    "machine learning": _CuratedEntry(
        title="Machine Learning Specialization",
        url="https://www.coursera.org/specializations/machine-learning-introduction",
        instructor="Andrew Ng — DeepLearning.AI & Stanford University",
        price_status="Free to audit",
    ),
    "cybersecurity": _CuratedEntry(
        title="Google Cybersecurity Professional Certificate",
        url="https://www.coursera.org/professional-certificates/google-cybersecurity",
        instructor="Google",
        price_status="Free to audit",
    ),
    "python": _CuratedEntry(
        title="Python for Everybody Specialization",
        url="https://www.coursera.org/specializations/python",
        instructor="Charles Russell Severance — University of Michigan",
        price_status="Free to audit",
    ),
    "aws": _CuratedEntry(
        title="AWS Cloud Technology Consultant Professional Certificate",
        url="https://www.coursera.org/professional-certificates/aws-cloud-technology-consultant",
        instructor="Amazon Web Services",
        price_status="Free to audit",
    ),
    "cloud computing": _CuratedEntry(
        title="AWS Cloud Technology Consultant Professional Certificate",
        url="https://www.coursera.org/professional-certificates/aws-cloud-technology-consultant",
        instructor="Amazon Web Services",
        price_status="Free to audit",
    ),
}

# Individually researched and verified real freeCodeCamp News articles (each hosts/embeds a full,
# free video course) — same discipline as UDEMY_COURSES/COURSERA_COURSES, verified in August 2026.
# This is the FREE-side counterpart: a specific article URL, never freecodecamp.org's homepage or
# search page. Every entry is free to access, so no price_status is set (the frontend shows a FREE
# badge, driven by is_free — see FREE_PLATFORMS below).
FREECODECAMP_RESOURCES: dict[str, _CuratedEntry] = {
    "angular": _CuratedEntry(
        title="Angular for Beginners Course + TypeScript [Full Front-End Tutorial]",
        url="https://www.freecodecamp.org/news/angular-for-beginners-course/",
    ),
    "typescript": _CuratedEntry(
        title="Learn TypeScript – The Ultimate Beginners Guide",
        url="https://www.freecodecamp.org/news/learn-typescript-beginners-guide/",
    ),
    "react": _CuratedEntry(
        title="Learn React - Full Course for Beginners",
        url="https://www.freecodecamp.org/news/learn-react-course/",
    ),
    "node.js": _CuratedEntry(
        title="Node.js Course for Beginners",
        url="https://www.freecodecamp.org/news/nodejs-course/",
    ),
    "node": _CuratedEntry(
        title="Node.js Course for Beginners",
        url="https://www.freecodecamp.org/news/nodejs-course/",
    ),
    "docker": _CuratedEntry(
        title="Docker Full Course",
        url="https://www.freecodecamp.org/news/docker-full-course/",
    ),
    "kubernetes": _CuratedEntry(
        title="Free 4-Hour Course on Docker and Kubernetes",
        url="https://www.freecodecamp.org/news/course-on-docker-and-kubernetes/",
    ),
    "sql": _CuratedEntry(
        title="Learn SQL for Efficient Data Storage and Retrieval",
        url="https://www.freecodecamp.org/news/learn-sql-full-course/",
    ),
    "mongodb": _CuratedEntry(
        title="MongoDB Full Course w/ Node.js, Express, & Mongoose",
        url="https://www.freecodecamp.org/news/mongodb-full-course-nodejs-express-mongoose/",
    ),
    "git": _CuratedEntry(
        title="Git & GitHub Crash Course for Beginners",
        url="https://www.freecodecamp.org/news/git-and-github-crash-course-for-beginners/",
    ),
    "github": _CuratedEntry(
        title="Git & GitHub Crash Course for Beginners",
        url="https://www.freecodecamp.org/news/git-and-github-crash-course-for-beginners/",
    ),
    "machine learning": _CuratedEntry(
        title="Learn Machine Learning – Full Comprehensive Course",
        url="https://www.freecodecamp.org/news/learn-machine-learning-in-2024/",
    ),
    "ml": _CuratedEntry(
        title="Learn Machine Learning – Full Comprehensive Course",
        url="https://www.freecodecamp.org/news/learn-machine-learning-in-2024/",
    ),
    "vue": _CuratedEntry(
        title="Learn Vue 3, a Front-End JavaScript Framework",
        url="https://www.freecodecamp.org/news/vue-3-full-course/",
    ),
    "vue.js": _CuratedEntry(
        title="Learn Vue 3, a Front-End JavaScript Framework",
        url="https://www.freecodecamp.org/news/vue-3-full-course/",
    ),
    "system design": _CuratedEntry(
        title="Learn Software System Design",
        url="https://www.freecodecamp.org/news/learn-software-system-design/",
    ),
    "python": _CuratedEntry(
        title="Free Python Crash Course",
        url="https://www.freecodecamp.org/news/free-python-crash-course/",
    ),
    "spring boot": _CuratedEntry(
        title="Spring Boot Tutorial - Learn the popular Java framework",
        url="https://www.freecodecamp.org/news/spring-boot-tutorial/",
    ),
    "spring": _CuratedEntry(
        title="Spring Boot Tutorial - Learn the popular Java framework",
        url="https://www.freecodecamp.org/news/spring-boot-tutorial/",
    ),
    "aws": _CuratedEntry(
        title="AWS Certified Cloud Practitioner Study Course – Pass the Exam With This Free Course",
        url="https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-certification-study-course-pass-the-exam/",
    ),
    "cloud computing": _CuratedEntry(
        title="AWS Certified Cloud Practitioner Study Course – Pass the Exam With This Free Course",
        url="https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-certification-study-course-pass-the-exam/",
    ),
    "cybersecurity": _CuratedEntry(
        title="Learn Cybersecurity from Harvard University",
        url="https://www.freecodecamp.org/news/learn-cybersecurity-from-harvard-university/",
    ),
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
    "udemy": UDEMY_COURSES,
    "coursera": COURSERA_COURSES,
    "freecodecamp": FREECODECAMP_RESOURCES,
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
    """Deterministically resolves the real title/URL/duration/instructor/price for a (platform,
    skill) pair. Never LLM-driven — see module docstring."""
    normalized = _normalize(skill)
    platform_name = PLATFORM_DISPLAY_NAMES[platform]
    is_free = platform in FREE_PLATFORMS

    registry = _CURATED_REGISTRIES.get(platform)
    if registry is not None:
        entry = registry.get(normalized)
        if entry is not None:
            # Udemy/Coursera entries carry a fully verified real URL directly; the other curated
            # registries build one from a verified slug + that platform's stable URL template.
            url = entry.url if entry.url is not None else _CURATED_URL_TEMPLATES[platform].format(slug=entry.slug)
            title = _CURATED_TITLE_TEMPLATES[platform].format(title=entry.title) if platform in _CURATED_TITLE_TEMPLATES else entry.title
            return ResolvedResource(
                platform,
                platform_name,
                title,
                url,
                entry.duration,
                is_curated=True,
                instructor=entry.instructor,
                price_status=entry.price_status,
                is_free=is_free,
            )

    if platform in _STATIC_CATALOG_PAGES:
        url, title = _STATIC_CATALOG_PAGES[platform]
        return ResolvedResource(
            platform, platform_name, title, url, None, is_curated=False, price_status=_FALLBACK_PRICE_STATUS.get(platform), is_free=is_free
        )

    builder = _SEARCH_URL_BUILDERS.get(platform)
    if builder is not None:
        return ResolvedResource(
            platform,
            platform_name,
            f"Explore {skill} on {platform_name}",
            builder(skill),
            None,
            is_curated=False,
            price_status=_FALLBACK_PRICE_STATUS.get(platform),
            is_free=is_free,
        )

    raise ValueError(f"Unknown learning platform key: {platform!r}")


# Preference order when a skill has more than one curated match on the paid/free side — picks the
# single best one per side rather than showing every possible platform for the same skill.
_PAID_PLATFORM_PRIORITY: list[str] = ["udemy", "coursera", "edx"]
_FREE_PLATFORM_PRIORITY: list[str] = ["freecodecamp", "kaggle_learn", "geeksforgeeks"]


def has_curated_match(platform: str, skill: str) -> bool:
    registry = _CURATED_REGISTRIES.get(platform)
    return registry is not None and _normalize(skill) in registry


def get_curated_matches(skill: str) -> dict[str, ResolvedResource | None]:
    """The ONLY entry point the recommender agent should use. Returns the single best verified
    paid resource and the single best verified free resource for `skill`, or None on either side
    when no curated (real, individually verified) match exists — callers must treat None as "don't
    recommend anything for this side," never fall back to a generic search/catalog link."""
    paid = next((resolve_resource(p, skill) for p in _PAID_PLATFORM_PRIORITY if has_curated_match(p, skill)), None)
    free = next((resolve_resource(p, skill) for p in _FREE_PLATFORM_PRIORITY if has_curated_match(p, skill)), None)
    return {"paid": paid, "free": free}
