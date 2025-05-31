from fastapi import FastAPI, HTTPException, Depends, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import httpx
import logging
import copy

from .database import get_db, engine
from . import models, schemas, crud
from .code_analyzer import CodeAnalyzer
from .github import GitHubWebhook
from .cache import cache
from .ml_model import code_smell_detector

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
#a small comment to push a change
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
webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET", "")
logger.info(f"Loaded webhook secret length: {len(webhook_secret) if webhook_secret else 0}")
github_webhook_handler = GitHubWebhook(webhook_secret=webhook_secret)

ADMIN_SECURITY_ANSWER = os.getenv("ADMIN_SECURITY_ANSWER", "mysecretanswer")
ADMIN_UNIQUE_CODE = os.getenv("ADMIN_UNIQUE_CODE", "ADM1N-C0DE-2024")
print(f"[DEBUG] ADMIN_SECURITY_ANSWER is: '{ADMIN_SECURITY_ANSWER}'")

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
        
        # Convert SQLAlchemy model to Pydantic model
        response_model = schemas.CodeAnalysis.model_validate(saved_analysis)
        
        # Add ML results to the response if present
        response = response_model.model_dump()
        for k in ['ai_code_smell', 'ai_confidence', 'ai_suggestions']:
            if k in analysis_result:
                response[k] = analysis_result[k]
        return response
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
    logger.info("Received GitHub webhook request")
    return await github_webhook_handler.process_webhook(request, db)

@app.get("/analytics")
async def get_analytics(
    timeRange: str = Query("30d", description="Time range for analytics (7d, 30d, 90d, 1y)"),
    db: Session = Depends(get_db)
):
    try:
        # Generate cache key based on timeRange
        cache_key = f"analytics_{timeRange}"
        
        # Check cache first
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Calculate date range
        end_date = datetime.utcnow()
        if timeRange == "7d":
            start_date = end_date - timedelta(days=7)
        elif timeRange == "30d":
            start_date = end_date - timedelta(days=30)
        elif timeRange == "90d":
            start_date = end_date - timedelta(days=90)
        elif timeRange == "1y":
            start_date = end_date - timedelta(days=365)
        else:
            raise HTTPException(status_code=400, detail="Invalid time range")

        # Get analyses within date range
        analyses = crud.get_analyses_by_date_range(db, start_date, end_date)
        
        # Calculate daily averages
        daily_data = {}
        for analysis in analyses:
            date = analysis.created_at.date().isoformat()
            if date not in daily_data:
                daily_data[date] = {
                    "overall_score": [],
                    "maintainability_score": [],
                    "security_score": [],
                    "complexity_score": []
                }
            
            daily_data[date]["overall_score"].append(analysis.overall_score)
            daily_data[date]["maintainability_score"].append(analysis.maintainability_score)
            daily_data[date]["security_score"].append(analysis.security_score)
            daily_data[date]["complexity_score"].append(analysis.complexity_score)

        # Calculate averages and format data
        analytics_data = []
        for date, scores in daily_data.items():
            analytics_data.append({
                "date": date,
                "overall_score": sum(scores["overall_score"]) / len(scores["overall_score"]),
                "maintainability_score": sum(scores["maintainability_score"]) / len(scores["maintainability_score"]),
                "security_score": sum(scores["security_score"]) / len(scores["security_score"]),
                "complexity_score": sum(scores["complexity_score"]) / len(scores["complexity_score"])
            })

        # Sort by date
        analytics_data.sort(key=lambda x: x["date"])

        # Calculate trends
        if len(analytics_data) >= 2:
            first = analytics_data[0]
            last = analytics_data[-1]
            trends = {
                "overall": {
                    "value": last["overall_score"],
                    "trend": "up" if last["overall_score"] > first["overall_score"] else "down" if last["overall_score"] < first["overall_score"] else "stable"
                },
                "maintainability": {
                    "value": last["maintainability_score"],
                    "trend": "up" if last["maintainability_score"] > first["maintainability_score"] else "down" if last["maintainability_score"] < first["maintainability_score"] else "stable"
                },
                "security": {
                    "value": last["security_score"],
                    "trend": "up" if last["security_score"] > first["security_score"] else "down" if last["security_score"] < first["security_score"] else "stable"
                },
                "complexity": {
                    "value": last["complexity_score"],
                    "trend": "up" if last["complexity_score"] > first["complexity_score"] else "down" if last["complexity_score"] < first["complexity_score"] else "stable"
                }
            }
        else:
            trends = {
                "overall": {"value": 0, "trend": "stable"},
                "maintainability": {"value": 0, "trend": "stable"},
                "security": {"value": 0, "trend": "stable"},
                "complexity": {"value": 0, "trend": "stable"}
            }

        result = {
            "analytics": analytics_data,
            "trends": trends
        }

        # Cache the result for 5 minutes
        cache.set(cache_key, result, 300)

        return result

    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/cache/clear")
async def clear_cache():
    """
    Clear the in-memory cache
    """
    try:
        cache.clear()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/cache/stats")
async def get_cache_stats():
    """
    Get cache statistics including hits, misses, and evictions
    """
    try:
        stats = cache.get_stats()
        stats['current_size'] = cache.get_size()
        stats['max_size'] = cache.maxsize
        return stats
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/analyses/{analysis_id}/label")
async def update_analysis_label(
    analysis_id: int,
    label_update: schemas.LabelUpdate,
    db: Session = Depends(get_db)
):
    analysis = crud.get_analysis(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    analysis.label = label_update.label
    db.commit()
    db.refresh(analysis)
    return {"id": analysis.id, "label": analysis.label}

@app.post("/analyze/user")
async def analyze_user_code(
    code: schemas.CodeSubmission,
    db: Session = Depends(get_db)
):
    try:
        # Always create a new analysis coroutine and await it
        analysis_result = await CodeAnalyzer().analyze(code.code)

        # Try to train the model (if enough labeled data)
        try:
            train_result = code_smell_detector.train(db)
            print("[DEBUG] ML model trained. Stats:", train_result)
        except Exception as e:
            print("[DEBUG] ML model training skipped or failed:", e)

        # Get ML prediction
        try:
            ml_prediction = code_smell_detector.predict(code.code)
            print("[DEBUG] ML Prediction:", ml_prediction)
        except Exception as e:
            print("[DEBUG] ML Prediction error:", e)
            ml_prediction = None

        # Create a CodeAnalysis object (do NOT include ml_prediction here)
        db_analysis = schemas.CodeAnalysis(
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

        # Convert SQLAlchemy model to Pydantic model
        response_model = schemas.CodeAnalysis.model_validate(saved_analysis)

        # Convert to dict and add ml_prediction
        response = response_model.model_dump()
        response['ml_prediction'] = ml_prediction

        return response
    except Exception as e:
        print("[DEBUG] Exception in /analyze/user:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/ml/train")
async def train_ml_model(db: Session = Depends(get_db)):
    """
    Train the ML model using labeled data
    """
    try:
        results = code_smell_detector.train(db)
        return {
            "message": "Model trained successfully",
            "results": results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/ml/train", response_class=HTMLResponse)
async def train_ml_model_page():
    """
    Serve a simple HTML page with a button to train the ML model
    """
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Train ML Model</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .container {
                    text-align: center;
                    margin-top: 50px;
                }
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    background-color: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #1d4ed8;
                }
                #result {
                    margin-top: 20px;
                    padding: 10px;
                    border-radius: 4px;
                }
                .success {
                    background-color: #dcfce7;
                    color: #166534;
                }
                .error {
                    background-color: #fee2e2;
                    color: #991b1b;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Train ML Model</h1>
                <p>Click the button below to train the ML model using labeled data.</p>
                <button onclick="trainModel()">Train Model</button>
                <div id="result"></div>
            </div>
            <script>
                async function trainModel() {
                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = 'Training model...';
                    resultDiv.className = '';
                    
                    try {
                        const response = await fetch('/admin/ml/train', {
                            method: 'POST'
                        });
                        const data = await response.json();
                        
                        if (response.ok) {
                            resultDiv.innerHTML = `
                                <strong>Success!</strong><br>
                                Training Accuracy: ${(data.results.train_accuracy * 100).toFixed(1)}%<br>
                                Test Accuracy: ${(data.results.test_accuracy * 100).toFixed(1)}%<br>
                                Samples Used: ${data.results.samples_used}
                            `;
                            resultDiv.className = 'success';
                        } else {
                            throw new Error(data.detail || 'Failed to train model');
                        }
                    } catch (error) {
                        resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
                        resultDiv.className = 'error';
                    }
                }
            </script>
        </body>
    </html>
    """

@app.post("/api/admin/auth")
async def admin_authenticate(answer: str = Body(..., embed=True)):
    if answer.strip().lower() == ADMIN_SECURITY_ANSWER.strip().lower():
        return {"code": ADMIN_UNIQUE_CODE}
    else:
        raise HTTPException(status_code=401, detail="Incorrect answer.")

@app.post("/api/admin/verify")
async def admin_verify(code: str = Body(..., embed=True)):
    if code == ADMIN_UNIQUE_CODE:
        return {"admin": True}
    else:
        return {"admin": False} 