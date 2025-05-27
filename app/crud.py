from sqlalchemy.orm import Session
from datetime import datetime
from . import models, schemas
from typing import List, Optional

def create_analysis(db: Session, analysis: schemas.CodeAnalysis) -> models.CodeAnalysis:
    """
    Create a new code analysis record
    """
    db_analysis = models.CodeAnalysis(**analysis.dict())
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
    limit: int = 10,
    repository: Optional[str] = None
) -> List[models.CodeAnalysis]:
    """
    Get a list of code analyses with pagination
    """
    query = db.query(models.CodeAnalysis)
    if repository:
        query = query.filter(models.CodeAnalysis.repository == repository)
    return query.order_by(models.CodeAnalysis.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

def get_analyses_by_date_range(db: Session, start_date: datetime, end_date: datetime):
    """Get all analyses within a date range"""
    return db.query(models.CodeAnalysis).filter(
        models.CodeAnalysis.created_at >= start_date,
        models.CodeAnalysis.created_at <= end_date
    ).all() 