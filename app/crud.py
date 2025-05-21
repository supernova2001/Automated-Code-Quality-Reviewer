from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional

def create_analysis(db: Session, analysis: schemas.CodeAnalysis) -> models.CodeAnalysis:
    """
    Create a new code analysis record
    """
    db_analysis = models.CodeAnalysis(
        code=analysis.code,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
        pylint_score=analysis.pylint_score,
        complexity_score=analysis.complexity_score,
        maintainability_score=analysis.maintainability_score,
        security_score=analysis.security_score,
        overall_score=analysis.overall_score,
        metrics=analysis.metrics.dict(),
        flake8_issues=[issue.dict() for issue in analysis.flake8_issues],
        bandit_issues=[issue.dict() for issue in analysis.bandit_issues]
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

def get_analysis(db: Session, analysis_id: int) -> Optional[models.CodeAnalysis]:
    """
    Get a specific code analysis by ID
    """
    return db.query(models.CodeAnalysis).filter(models.CodeAnalysis.id == analysis_id).first()

def get_analyses(
    db: Session,
    skip: int = 0,
    limit: int = 10
) -> List[models.CodeAnalysis]:
    """
    Get a list of code analyses with pagination
    """
    return db.query(models.CodeAnalysis)\
        .order_by(models.CodeAnalysis.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all() 