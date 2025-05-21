from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from dotenv import load_dotenv
from datetime import datetime
import httpx

from .database import get_db, engine
from . import models, schemas, crud
from .code_analyzer import CodeAnalyzer
from .github import GitHubWebhook

# Load environment variables
load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Automated Code Quality Reviewer",
    description="An API for automated code quality analysis and review",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize code analyzer and GitHub webhook handler
code_analyzer = CodeAnalyzer()
github_webhook_handler = GitHubWebhook(webhook_secret=os.getenv("GITHUB_WEBHOOK_SECRET", ""))

@app.get("/")
async def root():
    return {"message": "Welcome to Automated Code Quality Reviewer API"}

@app.get("/auth/github/callback")
async def github_callback(code: str):
    """
    Handle GitHub OAuth callback
    """
    try:
        # Exchange code for access token
        token_url = "https://github.com/login/oauth/access_token"
        data = {
            "client_id": os.getenv("GITHUB_CLIENT_ID"),
            "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
            "code": code
        }
        headers = {"Accept": "application/json"}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data, headers=headers)
            response.raise_for_status()
            token_data = response.json()
            
            return {"status": "success", "access_token": token_data.get("access_token")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze", response_model=schemas.CodeAnalysis)
async def analyze_code(
    code: schemas.CodeSubmission,
    db: Session = Depends(get_db)
):
    """
    Analyze submitted code for quality and potential issues
    """
    try:
        # Analyze the code
        analysis_result = await code_analyzer.analyze(code.code)
        
        # Create a CodeAnalysis object
        db_analysis = schemas.CodeAnalysis(
            id=0,  # Will be set by the database
            code=code.code,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            pylint_score=analysis_result['pylint_score'],
            complexity_score=analysis_result['complexity_score'],
            maintainability_score=analysis_result['maintainability_score'],
            security_score=analysis_result['security_score'],
            overall_score=analysis_result['overall_score'],
            metrics=schemas.AnalysisMetrics(**analysis_result['metrics']),
            flake8_issues=analysis_result['flake8_issues'],
            bandit_issues=analysis_result['bandit_issues']
        )
        
        # Save to database
        saved_analysis = crud.create_analysis(db, db_analysis)
        
        return saved_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyses", response_model=List[schemas.CodeAnalysis])
async def get_analyses(
    skip: int = 0,
    limit: int = 10,
    repository: str = None,
    db: Session = Depends(get_db)
):
    """
    Get list of previous code analyses
    """
    analyses = crud.get_analyses(db, skip=skip, limit=limit, repository=repository)
    return analyses

@app.get("/analyses/{analysis_id}", response_model=schemas.CodeAnalysis)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific code analysis by ID
    """
    analysis = crud.get_analysis(db, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@app.post("/webhook/github")
async def handle_github_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle GitHub webhook events
    """
    return await github_webhook_handler.process_webhook(request, db) 