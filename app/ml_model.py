from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import numpy as np
import joblib
import os
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from . import models

class CodeSmellDetector:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.pipeline = None
        self.model_path = "ml_model/code_smell_detector.joblib"
        self._load_or_create_model()

    def _load_or_create_model(self):
        """Load existing model or create a new one if it doesn't exist"""
        if os.path.exists(self.model_path):
            self.pipeline = joblib.load(self.model_path)
        else:
            self.pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(
                    max_features=1000,
                    ngram_range=(1, 2),
                    stop_words='english'
                )),
                ('classifier', RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                ))
            ])

    def train(self, db: Session) -> Dict[str, float]:
        """Train the model using labeled data from the database"""
        # Get all labeled analyses
        labeled_analyses = db.query(models.CodeAnalysis).filter(
            models.CodeAnalysis.label.isnot(None)
        ).all()

        if len(labeled_analyses) < 10:
            raise ValueError("Not enough labeled data for training. Need at least 10 samples.")

        # Prepare data
        X = [analysis.code for analysis in labeled_analyses]
        y = [analysis.label for analysis in labeled_analyses]

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Train model
        self.pipeline.fit(X_train, y_train)

        # Evaluate
        train_score = self.pipeline.score(X_train, y_train)
        test_score = self.pipeline.score(X_test, y_test)

        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.pipeline, self.model_path)

        return {
            "train_accuracy": train_score,
            "test_accuracy": test_score,
            "samples_used": len(labeled_analyses)
        }

    def predict(self, code: str) -> Dict[str, Any]:
        """Predict if the code has a code smell"""
        if not self.pipeline:
            raise ValueError("Model not trained yet")

        # Get prediction and probability
        prediction = self.pipeline.predict([code])[0]
        probabilities = self.pipeline.predict_proba([code])[0]
        confidence = probabilities[prediction]

        return {
            "prediction": int(prediction),  # 0 for clean, 1 for code smell
            "confidence": float(confidence)
        }

# Create a singleton instance
code_smell_detector = CodeSmellDetector() 