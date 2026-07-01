from langchain_core.tools import BaseTool


def get_tools() -> list[BaseTool]:
    """
    Return the list of tools available to the resume analysis agent.

    Currently empty — analysis is handled directly by the LLM via structured output.
    Future capabilities are registered here:

        from app.agent.tools import get_tools
        # Example future tools:
        #   - job_description_matcher   → compare resume against a JD
        #   - skills_gap_analyzer       → query a skills database
        #   - interview_question_gen    → generate role-specific questions
        #   - career_path_recommender   → suggest next roles
    """
    return []
