import joblib
import numpy as np
from transformers import AutoTokenizer, AutoModel
import torch
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models import CodeAnalysis
from app.database import SQLALCHEMY_DATABASE_URL
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

MODEL_PATH = 'code_smell_classifier.pkl'
BATCH_SIZE = 8

# Connect to DB
engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Query code and label from DB (only labeled rows)
records = session.query(CodeAnalysis).filter(CodeAnalysis.label != None).all()
codes = [r.code for r in records]
labels = [r.label for r in records]

if not codes or not labels:
    raise ValueError('No labeled data found in the database. Please label some code analyses first.')

# Load CodeBERT
tokenizer = AutoTokenizer.from_pretrained('microsoft/codebert-base')
model = AutoModel.from_pretrained('microsoft/codebert-base')
model.eval()

def get_embedding(code):
    inputs = tokenizer(code, return_tensors='pt', truncation=True, max_length=256)
    with torch.no_grad():
        outputs = model(**inputs)
        return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

embeddings = []
for i in range(0, len(codes), BATCH_SIZE):
    batch_codes = codes[i:i+BATCH_SIZE]
    batch_embeds = [get_embedding(code) for code in batch_codes]
    embeddings.extend(batch_embeds)

X = np.array(embeddings)
y = np.array(labels)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)
y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred))
joblib.dump(clf, MODEL_PATH)
print(f"Model saved to {MODEL_PATH}") 