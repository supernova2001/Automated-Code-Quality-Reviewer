from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

class CodeSubmission(BaseModel):
    code: str

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str = "python"  # Default to Python, can be extended for other languages

class RepoAnalysisRequest(BaseModel):
    repo_url: HttpUrl
    branch: str = "main"

class AnalysisResponse(BaseModel):
    analysis_id: int
    status: str

class Issue(BaseModel):
    type: str  # 'error', 'warning', or 'info'
    message: str
    line: int
    column: Optional[int] = None
    rule_id: Optional[str] = None

class AnalysisMetrics(BaseModel):
    code_size: int
    function_count: int
    class_count: int
    comment_ratio: float
    complexity_score: float
    pylint_score: float
    test_coverage: Optional[float] = None

class CodeAnalysis(BaseModel):
    id: int
    code: str
    created_at: datetime
    updated_at: datetime
    
    # Repository information (optional for backward compatibility)
    repository: Optional[str] = None
    commit_sha: Optional[str] = None
    commit_message: Optional[str] = None
    commit_author: Optional[str] = None
    file_path: Optional[str] = None
    
    # Analysis scores
    pylint_score: float
    complexity_score: float
    maintainability_score: float
    security_score: float
    overall_score: float
    
    # Analysis details
    metrics: AnalysisMetrics
    flake8_issues: List[dict]
    bandit_issues: List[dict]

    class Config:
        from_attributes = True 