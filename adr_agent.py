import os
from dotenv import load_dotenv
from fastmcp import FastMCP
from google import genai
from google.genai import types

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prompts")

def _load_prompt(filename: str) -> str:
    with open(os.path.join(PROMPTS_DIR, filename)) as f:
        return f.read()

# 1. Initialize FastMCP Server
mcp = FastMCP("A-ADR Architecture Agent")

# 2. Initialize Gemini Client
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

SYSTEM_PROMPT = _load_prompt("adr_system_prompt.md")
USER_PROMPT_TEMPLATE = _load_prompt("adr_user_prompt.md")

@mcp.tool()
def synthesize_adr(pr_title: str, pr_description: str, git_diff: str) -> str:
    """
    Analyzes PR metadata and code diffs to generate a formal Architecture Decision Record (ADR).
    
    Args:
        pr_title: The title of the pull request.
        pr_description: The PR body containing developer comments and rationale.
        git_diff: The raw code diff or list of modified dependency files.
    """
    prompt = USER_PROMPT_TEMPLATE.format(
        pr_title=pr_title,
        pr_description=pr_description,
        git_diff=git_diff,
    )

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