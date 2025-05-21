import hmac
import hashlib
import json
import logging
from typing import Dict, Optional
from fastapi import HTTPException, Request
import httpx
from .code_analyzer import CodeAnalyzer
from .database import get_db
from . import crud, schemas

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GitHubWebhook:
    def __init__(self, webhook_secret: str):
        self.webhook_secret = webhook_secret
        self.code_analyzer = CodeAnalyzer()

    def verify_signature(self, request: Request, payload: bytes) -> bool:
        """Verify GitHub webhook signature"""
        try:
            signature = request.headers.get('X-Hub-Signature-256')
            if not signature:
                logger.error("No signature found in request headers")
                return False
            
            expected_signature = f"sha256={hmac.new(self.webhook_secret.encode(), payload, hashlib.sha256).hexdigest()}"
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying signature: {str(e)}")
            return False

    async def handle_push_event(self, payload: Dict, db) -> Dict:
        """Handle GitHub push event"""
        try:
            # Get repository details
            repo_name = payload['repository']['full_name']
            commit_sha = payload['head_commit']['id']
            commit_message = payload['head_commit']['message']
            commit_author = payload['head_commit']['author']['name']
            commit_date = payload['head_commit']['timestamp']
            
            logger.info(f"Processing push event for repository: {repo_name}, commit: {commit_sha}")
            
            # Get file contents from GitHub
            async with httpx.AsyncClient(follow_redirects=True) as client:
                # Get list of files in the commit
                files_response = await client.get(
                    f"https://api.github.com/repos/{repo_name}/commits/{commit_sha}",
                    headers={"Accept": "application/vnd.github.v3+json"}
                )
                files_response.raise_for_status()
                commit_data = files_response.json()
                
                analysis_results = []
                
                # Analyze each Python file in the commit
                for file in commit_data['files']:
                    if file['filename'].endswith('.py'):
                        logger.info(f"Analyzing file: {file['filename']}")
                        try:
                            # Get file contents using raw.githubusercontent.com
                            raw_url = f"https://raw.githubusercontent.com/{repo_name}/{commit_sha}/{file['filename']}"
                            file_response = await client.get(raw_url)
                            file_response.raise_for_status()
                            code = file_response.text
                            
                            # Analyze the code
                            analysis_result = await self.code_analyzer.analyze(code)
                            
                            # Create analysis record
                            db_analysis = schemas.CodeAnalysis(
                                code=code,
                                created_at=commit_date,
                                updated_at=commit_date,
                                repository=repo_name,
                                commit_sha=commit_sha,
                                commit_message=commit_message,
                                commit_author=commit_author,
                                file_path=file['filename'],
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
                            analysis_results.append(saved_analysis)
                            logger.info(f"Successfully analyzed and saved results for {file['filename']}")
                        except Exception as e:
                            logger.error(f"Error analyzing file {file['filename']}: {str(e)}")
                            continue
                
                return {
                    "status": "success",
                    "repository": repo_name,
                    "commit": commit_sha,
                    "analyses": analysis_results
                }
                
        except Exception as e:
            logger.error(f"Error processing push event: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def process_webhook(self, request: Request, db) -> Dict:
        """Process GitHub webhook event"""
        try:
            # Read request body
            payload = await request.body()
            
            # Log webhook event
            event_type = request.headers.get('X-GitHub-Event')
            logger.info(f"Received webhook event: {event_type}")
            
            # Verify signature
            if not self.verify_signature(request, payload):
                logger.error("Invalid webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")
            
            # Parse payload
            payload_data = json.loads(payload)
            
            # Handle different event types
            if event_type == 'push':
                return await self.handle_push_event(payload_data, db)
            else:
                logger.info(f"Ignoring event type: {event_type}")
                return {"status": "ignored", "event": event_type}
                
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding webhook payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 