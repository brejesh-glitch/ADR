import os
from dotenv import load_dotenv
from fastmcp import FastMCP
from google import genai
from google.genai import types

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# 1. Initialize FastMCP Server
mcp = FastMCP("A-ADR Architecture Agent")

# 2. Initialize Gemini Client
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are A-ADR, a strict design-mode agent. Your role is to synthesize Architecture Decision Records (ADRs).
Rules:
- Respect the Do-Not-Delegate rule: synthesize choices explicitly made by human authors in PR context.
- Output clean Markdown following standard ADR schemas (Title, Context, Decision, Alternatives, Consequences).
- Start status as `draft`.
"""

@mcp.tool()
def synthesize_adr(pr_title: str, pr_description: str, git_diff: str) -> str:
    """
    Analyzes PR metadata and code diffs to generate a formal Architecture Decision Record (ADR).
    
    Args:
        pr_title: The title of the pull request.
        pr_description: The PR body containing developer comments and rationale.
        git_diff: The raw code diff or list of modified dependency files.
    """
    prompt = f"""
    Evaluate the following PR and generate a formal ADR in Markdown format if an architectural decision was made.

    PR Title: {pr_title}
    PR Rationale: {pr_description}
    
    GIT DIFF:
    {git_diff}
    """

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
        )
    )

    return response.text

if __name__ == "__main__":
    mcp.run()