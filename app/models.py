from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class CodeAnalysis(Base):
    __tablename__ = "code_analyses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Repository information
    repository = Column(String, index=True)
    commit_sha = Column(String, index=True)
    commit_message = Column(String)
    commit_author = Column(String)
    file_path = Column(String)
    
    # Analysis scores
    pylint_score = Column(Float)
    complexity_score = Column(Float)
    maintainability_score = Column(Float)
    security_score = Column(Float)
    overall_score = Column(Float)
    
    # Analysis details
    metrics = Column(JSON)
    flake8_issues = Column(JSON)
    bandit_issues = Column(JSON) 