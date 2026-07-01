import logging
from functools import lru_cache

from langchain_core.tools import BaseTool
from langchain_openai import AzureChatOpenAI

from app.agent.prompts import ANALYSIS_PROMPT
from app.agent.tools import get_tools
from app.core.config import Settings, get_settings
from app.models.schemas import ResumeAnalysis

logger = logging.getLogger(__name__)


class ResumeAnalyzerAgent:
    """
    LangChain-based resume analysis agent backed by Azure OpenAI.

    Exposes a single stable interface — analyze(text) → ResumeAnalysis — so the
    FastAPI route never needs to change as capabilities grow.

    Internally uses an LCEL chain:
        ANALYSIS_PROMPT | AzureChatOpenAI.with_structured_output(ResumeAnalysis)

    The `|` operator composes two LangChain Runnables:
      1. ANALYSIS_PROMPT formats the resume text into a chat message list.
      2. The structured LLM calls Azure OpenAI and parses the JSON response
         directly into a validated ResumeAnalysis Pydantic object.

    Additional tools registered via register_tool() will be incorporated into
    an AgentExecutor in a future iteration without changing this class's interface.
    """

    def __init__(self, settings: Settings) -> None:
        self._llm = AzureChatOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_deployment=settings.azure_openai_chat_deployment,
            temperature=0.3,
            max_retries=2,
        )
        self._tools: list[BaseTool] = get_tools()
        self._chain = ANALYSIS_PROMPT | self._llm.with_structured_output(ResumeAnalysis)

        logger.info(
            "ResumeAnalyzerAgent initialised (deployment=%s, tools=%d)",
            settings.azure_openai_chat_deployment,
            len(self._tools),
        )

    def register_tool(self, tool: BaseTool) -> None:
        """Register an additional tool for future agentic capabilities."""
        self._tools.append(tool)
        logger.info("Tool registered: %s (total=%d)", tool.name, len(self._tools))

    async def analyze(self, resume_text: str) -> ResumeAnalysis:
        """Run the analysis chain and return structured results."""
        logger.info("Analysing resume (%d chars)", len(resume_text))
        result: ResumeAnalysis = await self._chain.ainvoke({"resume_text": resume_text})
        logger.info("Analysis complete — ATS score: %d", result.ats_score)
        return result


@lru_cache(maxsize=1)
def get_resume_agent() -> ResumeAnalyzerAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return ResumeAnalyzerAgent(get_settings())
