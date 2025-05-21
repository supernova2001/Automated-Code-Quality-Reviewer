from celery import Celery
import os
from dotenv import load_dotenv
import tempfile
import subprocess
import json
from typing import Dict, List
import git
from . import crud
from .database import SessionLocal

load_dotenv()

# Celery configuration
celery_app = Celery(
    "code_analyzer",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

def run_pylint(code_path: str) -> Dict:
    """Run pylint on the code and return results."""
    try:
        result = subprocess.run(
            ["pylint", "--output-format=json", code_path],
            capture_output=True,
            text=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        return {"error": str(e)}

def run_flake8(code_path: str) -> Dict:
    """Run flake8 on the code and return results."""
    try:
        result = subprocess.run(
            ["flake8", "--format=json", code_path],
            capture_output=True,
            text=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        return {"error": str(e)}

def run_bandit(code_path: str) -> Dict:
    """Run bandit on the code and return results."""
    try:
        result = subprocess.run(
            ["bandit", "-f", "json", "-r", code_path],
            capture_output=True,
            text=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        return {"error": str(e)}

def calculate_overall_score(results: Dict) -> int:
    """Calculate an overall score based on the analysis results."""
    score = 100
    
    # Deduct points for each issue found
    if "pylint_results" in results:
        score -= len(results["pylint_results"]) * 2
    
    if "flake8_results" in results:
        score -= len(results["flake8_results"]) * 1
    
    if "bandit_results" in results:
        score -= len(results["bandit_results"].get("results", [])) * 5
    
    return max(0, score)

@celery_app.task
def analyze_code_task(analysis_id: int, source: str):
    """Celery task to analyze code or repository."""
    db = SessionLocal()
    try:
        # Update status to processing
        crud.update_analysis_status(db, analysis_id, "processing")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            if source.startswith(("http://", "https://")):
                # Clone repository
                repo_path = os.path.join(temp_dir, "repo")
                git.Repo.clone_from(source, repo_path)
                code_path = repo_path
            else:
                # Write code to temporary file
                code_path = os.path.join(temp_dir, "code.py")
                with open(code_path, "w") as f:
                    f.write(source)
            
            # Run analysis tools
            results = {
                "pylint_results": run_pylint(code_path),
                "flake8_results": run_flake8(code_path),
                "bandit_results": run_bandit(code_path)
            }
            
            # Calculate overall score
            overall_score = calculate_overall_score(results)
            
            # Combine all issues
            issues = []
            for tool, result in results.items():
                if isinstance(result, dict) and "results" in result:
                    for issue in result["results"]:
                        issues.append({
                            "tool": tool.split("_")[0],
                            "type": issue.get("type", "warning"),
                            "message": issue.get("message", ""),
                            "line": issue.get("line"),
                            "column": issue.get("column"),
                            "file": issue.get("file")
                        })
            
            # Update analysis results
            crud.update_analysis_results(
                db,
                analysis_id,
                pylint_results=results["pylint_results"],
                flake8_results=results["flake8_results"],
                bandit_results=results["bandit_results"],
                overall_score=overall_score,
                issues=issues
            )
            
    except Exception as e:
        crud.update_analysis_status(db, analysis_id, "failed")
        raise e
    finally:
        db.close() 