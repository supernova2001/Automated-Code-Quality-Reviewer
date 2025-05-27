from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from ..ml_service.code_analyzer import CodeAnalyzer

router = APIRouter()
code_analyzer = CodeAnalyzer()

class CodeAnalysisRequest(BaseModel):
    code: str

class CodeAnalysisResponse(BaseModel):
    code_smells: list
    suggestions: list
    ai_score: float

@router.post("/analyze", response_model=CodeAnalysisResponse)
async def analyze_code(request: CodeAnalysisRequest) -> Dict[str, Any]:
    try:
        analysis_result = code_analyzer.analyze_code(request.code)
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 